import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { SearchProjectionBuilder } from './projection.builder';
import { opensearchClient } from './opensearch.client';
import { USER_INDEX_NAME } from './opensearch.mapping';
import type { IndexSyncJob } from './sync.types';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export class IndexSyncWorker {
  /**
   * Processes an index synchronization job against the authoritative PostgreSQL database.
   */
  public async processJob(job: IndexSyncJob): Promise<void> {
    if (job.type === 'DELETE_USER') {
      const isUp = await opensearchClient.ping();
      if (isUp) {
        await opensearchClient.deleteDocument(USER_INDEX_NAME, job.userId);
      }
      return;
    }

    // 1. Fetch current authoritative state from PostgreSQL
    const user = await prisma.user.findUnique({
      where: { id: job.userId },
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
    });

    // 2. Handle deletion convergence: if user was deleted from PostgreSQL, remove from index
    if (!user) {
      const isUp = await opensearchClient.ping();
      if (isUp) {
        await opensearchClient.deleteDocument(USER_INDEX_NAME, job.userId);
      }
      return;
    }

    // 3. Build sanitized, approved search projection document
    const doc = SearchProjectionBuilder.build(user);

    // 4. Index in OpenSearch if available
    const isUp = await opensearchClient.ping();
    if (isUp) {
      await opensearchClient.bulkIndex(USER_INDEX_NAME, [doc]);
    }
  }
}

export const indexSyncWorker = new IndexSyncWorker();
