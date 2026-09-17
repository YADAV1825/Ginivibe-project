import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { JWT_SECRET } from './src/config/auth';
import { TextAnalyzer } from './src/features/search/text.analyzer';
import { LexicalScorer } from './src/features/search/lexical.scorer';
import { OpenSearchQueryBuilder } from './src/features/search/opensearch.query';
import { searchService } from './src/features/search/search.service';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log('🧪 Starting GiniVibe Level 4 Tokenization & Lexical Search Verification Suite...\n');

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

  // --- Category 1: Text Normalization & Tokenization ---
  console.log('🔤 Test Category: Text Normalization & Tokenization Engine');

  const normalized = TextAnalyzer.normalizeText('  Café   Hélène &   TRAVEL  \x00\x07');
  assert(
    normalized === 'cafe helene & travel',
    `Unicode NFKD strips diacritics and control chars (actual: "${normalized}")`
  );

  const tokens = TextAnalyzer.tokenize('user_handle123   photography & travel-lover');
  assert(
    tokens.includes('user_handle123') && tokens.includes('photography') && tokens.includes('travel-lover'),
    'Tokenization preserves exact identifiers and alphanumeric compounds without stemming corruption'
  );

  // --- Category 2: Controlled Synonym Expansion (Section 42) ---
  console.log('\n📖 Test Category: Controlled Domain Synonym Expansion');

  const photoSynonyms = TextAnalyzer.expandSynonyms(['photo']);
  assert(
    photoSynonyms.includes('photography') && photoSynonyms.includes('photographer'),
    'Synonym expansion maps "photo" -> "photography" and "photographer"'
  );

  const devSynonyms = TextAnalyzer.expandSynonyms(['dev']);
  assert(
    devSynonyms.includes('software engineering') && devSynonyms.includes('developer'),
    'Synonym expansion maps "dev" -> "software engineering" and "developer"'
  );

  // --- Category 3: Levenshtein Distance & Typo Tolerance ---
  console.log('\n🎯 Test Category: Levenshtein Typo Tolerance');

  const dist1 = LexicalScorer.levenshteinDistance('amandeep', 'amndep');
  assert(dist1 === 2, 'Levenshtein distance correctly computed (amandeep vs amndep = 2)');

  const fuzzyMatchLong = LexicalScorer.isFuzzyMatch('amndep', 'amandeep');
  assert(fuzzyMatchLong, 'Typo-tolerance matches 6-char typo with 8-char target');

  const fuzzyMatchShort = LexicalScorer.isFuzzyMatch('cat', 'cot');
  assert(!fuzzyMatchShort, 'Typo-tolerance forbids fuzzy matching on short words (< 4 chars)');

  // --- Category 4: Relevance Ranking & Multi-Field Scoring ---
  console.log('\n📊 Test Category: Relevance Ranking & Multi-Field Scoring');

  const exactCandidate = {
    username: 'aman',
    displayName: 'Aman Yadav',
    bio: 'Software engineer',
    interests: ['AI Developments'],
  };

  const bioOnlyCandidate = {
    username: 'john_doe',
    displayName: 'John Doe',
    bio: 'Friend of aman from college',
    interests: ['Finance'],
  };

  const scoreExact = LexicalScorer.scoreCandidate('aman', ['aman'], exactCandidate);
  const scoreBio = LexicalScorer.scoreCandidate('aman', ['aman'], bioOnlyCandidate);

  assert(
    scoreExact > scoreBio * 3,
    `Exact username candidate scores significantly higher than bio mention (${scoreExact} vs ${scoreBio})`
  );

  // --- Category 5: OpenSearch Lexical Query Builder ---
  console.log('\n🔍 Test Category: OpenSearch DSL Query Generation');

  const dsl = OpenSearchQueryBuilder.buildLexicalQuery('photo') as any;
  assert(dsl && dsl.query && dsl.query.bool && Array.isArray(dsl.query.bool.should), 'DSL builds valid bool.should query');
  assert(
    dsl.query.bool.should.some((s: any) => s.term && s.term['username.keyword']),
    'DSL includes term query on username.keyword with boost'
  );
  assert(
    dsl.query.bool.should.some((s: any) => s.multi_match && s.multi_match.fields),
    'DSL includes multi_match query with field boosting'
  );

  // --- Category 6: HTTP Autocomplete Endpoint ---
  console.log('\n⚡ Test Category: Lightweight Autocomplete Endpoint');

  const userA = await prisma.user.findFirst();
  if (!userA) throw new Error('Database must have a user');

  const tokenA = jwt.sign({ id: userA.id, username: userA.username }, JWT_SECRET, { expiresIn: '1h' });

  // Test 1: Query < 2 chars returns empty array immediately (debounced/short query protection)
  const shortAutoRes = await fetch(`${BASE_URL}/api/search/autocomplete?q=a`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(shortAutoRes.status === 200, 'Autocomplete short query returns HTTP 200');
  const shortAutoJson = await shortAutoRes.json();
  assert(Array.isArray(shortAutoJson) && shortAutoJson.length === 0, 'Query < 2 chars returns empty suggestions array');

  // Test 2: Valid autocomplete suggestion
  const autoRes = await fetch(`${BASE_URL}/api/search/autocomplete?q=an&limit=5`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(autoRes.status === 200, 'Valid autocomplete query returns HTTP 200');
  const autoJson = await autoRes.json();
  assert(Array.isArray(autoJson) && autoJson.length > 0, 'Autocomplete returns suggestion array');

  const firstSug = autoJson[0];
  assert(
    firstSug.id && firstSug.username && firstSug.displayName,
    'Autocomplete suggestion contains minimal lightweight fields (id, username, displayName)'
  );
  assert(
    firstSug.password === undefined && firstSug.email === undefined,
    'Autocomplete suggestions strictly exclude password and email'
  );

  // Test 3: Self-Exclusion in autocomplete
  assert(
    !autoJson.some((sug: any) => sug.id === userA.id),
    'Autocomplete strictly excludes requester from suggestions'
  );

  console.log(`\n🎉 All ${passed}/${total} Level 4 verification tests passed successfully!\n`);
}

runTests()
  .catch((err) => {
    console.error('\n❌ Level 4 test suite failure:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
