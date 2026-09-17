import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { SearchProjectionBuilder } from './projection.builder';
import { opensearchClient } from './opensearch.client';
import {
  USER_INDEX_NAME,
  USER_INDEX_ALIAS,
  USER_INDEX_MAPPING,
} from './opensearch.mapping';
import type {
  ReindexOptions,
  ReindexResult,
  SearchProjectionDocument,
} from './projection.types';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export class ReindexService {
  /**
   * Transforms a batch of raw Prisma users into approved SearchProjectionDocuments.
   */
  public buildProjectionsBatch(rawUsers: any[]): {
    projections: SearchProjectionDocument[];
    errors: Array<{ userId: string; error: string }>;
  } {
    const projections: SearchProjectionDocument[] = [];
    const errors: Array<{ userId: string; error: string }> = [];

    for (const raw of rawUsers) {
      try {
        const doc = SearchProjectionBuilder.build(raw);
        projections.push(doc);
      } catch (err: any) {
        errors.push({
          userId: raw.id || 'unknown',
          error: err.message || 'Unknown projection builder error',
        });
      }
    }

    return { projections, errors };
  }

  /**
   * Executes a bounded cursor-based reindex of all users from PostgreSQL.
   * Protects server memory by streaming in manageable batches (Sections 25 & 52).
   */
  public async reindexAll(options: ReindexOptions = {}): Promise<ReindexResult> {
    const startTime = Date.now();
    const batchSize = Math.min(Math.max(options.batchSize || 50, 10), 500);
    const maxLimit = options.limit || Infinity;

    let cursorId: string | undefined = undefined;
    let totalProcessed = 0;
    let batchCount = 0;
    const allErrors: Array<{ userId: string; error: string }> = [];

    // Check OpenSearch readiness if write is enabled
    let canWriteOpenSearch = false;
    if (options.writeToOpenSearch) {
      const isUp = await opensearchClient.ping();
      if (isUp) {
        canWriteOpenSearch = true;
        const exists = await opensearchClient.indexExists(USER_INDEX_NAME);
        if (!exists) {
          await opensearchClient.createIndex(USER_INDEX_NAME, USER_INDEX_MAPPING);
          await opensearchClient.putAlias(USER_INDEX_NAME, USER_INDEX_ALIAS);
        }
      } else {
        console.warn(
          `[ReindexService] OpenSearch is not reachable at configured URL. Skipping remote write.`
        );
      }
    }

    while (totalProcessed < maxLimit) {
      const currentBatchSize = Math.min(batchSize, maxLimit - totalProcessed);

      const findArgs: any = {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          bio: true,
          profilePic: true,
          gender: true,
          zodiacSign: true,
          dob: true,
          createdAt: true,
          interests: {
            select: {
              subInterest: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        take: currentBatchSize,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      };

      if (cursorId) {
        findArgs.cursor = { id: cursorId };
        findArgs.skip = 1;
      }

      const batchUsers: any[] = await prisma.user.findMany(findArgs);

      if (batchUsers.length === 0) {
        break;
      }

      batchCount++;
      cursorId = batchUsers[batchUsers.length - 1].id;

      // Project batch
      const { projections, errors } = this.buildProjectionsBatch(batchUsers);
      allErrors.push(...errors);
      totalProcessed += projections.length;

      // Write to OpenSearch if enabled and cluster is online
      if (canWriteOpenSearch && projections.length > 0) {
        try {
          const bulkRes = await opensearchClient.bulkIndex(USER_INDEX_NAME, projections);
          if (bulkRes.errors.length > 0) {
            console.warn(
              `[ReindexService] Batch ${batchCount} had ${bulkRes.errors.length} OpenSearch bulk errors.`
            );
          }
        } catch (err: any) {
          allErrors.push({
            userId: `batch-${batchCount}`,
            error: `OpenSearch bulk indexing failed: ${err.message}`,
          });
        }
      }

      if (batchUsers.length < currentBatchSize) {
        break; // Reached end of dataset
      }
    }

    const durationMs = Date.now() - startTime;

    return {
      totalProcessed,
      batchCount,
      errors: allErrors,
      durationMs,
      projectionVersion: 1,
    };
  }
}

export const reindexService = new ReindexService();
