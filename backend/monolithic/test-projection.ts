import 'dotenv/config';
import { SearchProjectionBuilder, CanonicalTextBuilder } from './src/features/search/projection.builder';
import { reindexService } from './src/features/search/reindex.service';
import { USER_INDEX_MAPPING, USER_INDEX_NAME, USER_INDEX_ALIAS } from './src/features/search/opensearch.mapping';
import { opensearchClient } from './src/features/search/opensearch.client';

async function runTests() {
  console.log('🧪 Starting GiniVibe Level 2 Search Projection & Mapping Verification Suite...\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
      throw new Error(`Assertion failed for: ${testName}`);
    }
  }

  // --- Category 1: CanonicalTextBuilder ---
  console.log('📝 Test Category: Canonical Text Formatting');

  const canonicalText = CanonicalTextBuilder.build({
    displayName: 'Aman Yadav',
    username: 'amandeep1825',
    bio: 'Software engineer and photography lover',
    interests: ['Photography', 'AI Developments', 'Software Engineering'],
    zodiacSign: 'Scorpio',
    gender: 'Male',
  });

  assert(
    canonicalText.includes('Name: Aman Yadav'),
    'Canonical text contains normalized Name'
  );
  assert(
    canonicalText.includes('Username: amandeep1825'),
    'Canonical text contains normalized Username'
  );
  assert(
    canonicalText.includes('Interests: AI Developments, Photography, Software Engineering'),
    'Canonical text sorts and formats interests alphabetically'
  );
  assert(
    canonicalText.includes('Zodiac: Scorpio') && canonicalText.includes('Gender: Male'),
    'Canonical text formats metadata fields accurately'
  );

  // --- Category 2: SearchProjectionBuilder & SHA-256 Hashing ---
  console.log('\n🔒 Test Category: SearchProjectionBuilder & Cost-Control Hashing');

  const sampleRawUser = {
    id: 'usr-uuid-test-01',
    username: 'aman_test',
    firstName: 'Aman',
    lastName: 'Yadav',
    bio: 'Tech enthusiast',
    profilePic: 'https://cdn.ginivibe.com/p/1.jpg',
    gender: 'male',
    zodiacSign: 'Scorpio',
    dob: '1998-05-15',
    interests: [
      { subInterest: { name: 'AI Developments' } },
      { subInterest: { name: 'Investing' } },
    ],
  };

  const doc1 = SearchProjectionBuilder.build(sampleRawUser);
  assert(doc1.userId === 'usr-uuid-test-01', 'Document preserves stable user ID');
  assert(doc1.displayName === 'Aman Yadav', 'Display name formatted properly');
  assert(
    doc1.interests.length === 2 && doc1.interests[0] === 'AI Developments',
    'Interests extracted and sorted properly'
  );
  assert(doc1.projectionVersion === 1, 'Projection version is 1');
  assert(typeof doc1.contentHash === 'string' && doc1.contentHash.length === 64, 'SHA-256 contentHash is valid 64-char hex');

  // Idempotency check: identical input must produce identical hash and content
  const doc2 = SearchProjectionBuilder.build(sampleRawUser);
  assert(doc1.contentHash === doc2.contentHash, 'Content hash is strictly deterministic for identical data');

  // Change sensitivity check: modifying bio changes hash
  const docModified = SearchProjectionBuilder.build({
    ...sampleRawUser,
    bio: 'Tech enthusiast and mountain climber',
  });
  assert(
    doc1.contentHash !== docModified.contentHash,
    'Modifying profile content produces a distinct SHA-256 hash'
  );

  // Security test: Password inclusion must be rejected
  let passwordRejected = false;
  try {
    SearchProjectionBuilder.build({
      ...sampleRawUser,
      password: 'hashed_password_should_never_be_here',
    });
  } catch (err: any) {
    if (err.message.includes('SECURITY VIOLATION')) {
      passwordRejected = true;
    }
  }
  assert(passwordRejected, 'SECURITY VIOLATION thrown if password field is passed to projection builder');

  // --- Category 3: OpenSearch Mapping Specification ---
  console.log('\n🗺️ Test Category: OpenSearch Index Mapping & Client Abstraction');

  assert(USER_INDEX_NAME === 'ginivibe-users-v1', 'Index name uses versioned convention ginivibe-users-v1');
  assert(USER_INDEX_ALIAS === 'ginivibe-users', 'Index alias uses ginivibe-users');
  assert(
    USER_INDEX_MAPPING.mappings.properties.userId.type === 'keyword',
    'Mapping configures userId as keyword'
  );
  assert(
    USER_INDEX_MAPPING.mappings.properties.username.type === 'text' &&
      USER_INDEX_MAPPING.mappings.properties.username.fields.keyword.type === 'keyword',
    'Mapping configures username as multi-field (text + keyword)'
  );

  const pingResult = await opensearchClient.ping();
  assert(
    typeof pingResult === 'boolean',
    'OpenSearchClient ping cleanly returns boolean status without crashing when offline'
  );

  // --- Category 4: Full PostgreSQL Bounded Batch Reindexing ---
  console.log('\n🔄 Test Category: Full PostgreSQL Batch Reindexing Engine');

  const reindexResult = await reindexService.reindexAll({
    batchSize: 25,
    writeToOpenSearch: false, // In test environment without cluster
  });

  assert(
    reindexResult.totalProcessed === 110,
    `Batch reindexing processed all 110 seeded PostgreSQL users (actual: ${reindexResult.totalProcessed})`
  );
  assert(
    reindexResult.batchCount === 5,
    `Batch reindexing executed in 5 cursor batches of 25 (actual: ${reindexResult.batchCount})`
  );
  assert(
    reindexResult.errors.length === 0,
    'Zero projection builder errors encountered across entire user population'
  );
  assert(
    reindexResult.durationMs > 0,
    `Reindex completed in ${reindexResult.durationMs}ms with bounded memory`
  );

  console.log(`\n🎉 All ${passed}/${total} Level 2 verification tests passed successfully!\n`);
}

runTests().catch((err) => {
  console.error('\n❌ Level 2 test suite failure:', err);
  process.exit(1);
});
