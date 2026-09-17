import 'dotenv/config';
import { reindexService } from './reindex.service';

async function main() {
  console.log('🔄 Starting GiniVibe Search Projection Rebuild...');
  console.log('   Source of Truth: PostgreSQL');
  console.log('   Target Index: ginivibe-users-v1\n');

  const result = await reindexService.reindexAll({
    batchSize: 50,
    writeToOpenSearch: true,
  });

  console.log('✅ Reindexing completed successfully!');
  console.log(`   Total Users Processed: ${result.totalProcessed}`);
  console.log(`   Batches Executed:      ${result.batchCount}`);
  console.log(`   Errors Encountered:    ${result.errors.length}`);
  console.log(`   Duration:              ${result.durationMs}ms`);
  console.log(`   Projection Version:    v${result.projectionVersion}`);

  if (result.errors.length > 0) {
    console.error('\n⚠️ Errors encountered during reindexing:');
    for (const err of result.errors) {
      console.error(`   - [User: ${err.userId}]: ${err.error}`);
    }
  }

  process.exit(result.errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('❌ Fatal error during reindexing:', err);
  process.exit(1);
});
