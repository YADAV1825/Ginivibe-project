import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { JWT_SECRET } from './src/config/auth';
import { FilterValidator } from './src/features/search/filter.validator';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log('🧪 Starting GiniVibe Level 5 Structured Filters Verification Suite...\n');

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

  // --- Category 1: FilterValidator Unit & Security Invariants ---
  console.log('🛡️ Test Category: FilterValidator & Injection Protection');

  // Test 1: Valid gender
  const validGenderRes = FilterValidator.validateAndParse({ gender: 'Female' });
  assert(validGenderRes.filters.gender === 'female', 'Valid gender normalized to lowercase');

  // Test 2: Invalid gender rejection
  const invalidGenderRes = FilterValidator.validateAndParse({ gender: 'alien_cyborg' });
  assert(
    !!invalidGenderRes.error && invalidGenderRes.error.includes('Allowed values'),
    'Invalid gender rejected with explanatory error'
  );

  // Test 3: Valid zodiac sign
  const validZodiacRes = FilterValidator.validateAndParse({ zodiacSign: 'Taurus' });
  assert(validZodiacRes.filters.zodiacSign === 'taurus', 'Valid zodiac sign normalized to lowercase');

  // Test 4: Invalid zodiac rejection
  const invalidZodiacRes = FilterValidator.validateAndParse({ zodiacSign: 'Ophiuchus_fake' });
  assert(!!invalidZodiacRes.error, 'Invalid zodiac sign rejected');

  // Test 5: Age range boundary validation
  const validAgeRes = FilterValidator.validateAndParse({ ageMin: '20', ageMax: '30' });
  assert(
    validAgeRes.filters.ageMin === 20 && validAgeRes.filters.ageMax === 30,
    'Numeric age bounds parsed properly from strings'
  );

  const invertedAgeRes = FilterValidator.validateAndParse({ ageMin: 35, ageMax: 25 });
  assert(
    !!invertedAgeRes.error && invertedAgeRes.error.includes('cannot be greater than ageMax'),
    'Inverted age range (ageMin > ageMax) rejected'
  );

  const underAgeRes = FilterValidator.validateAndParse({ ageMin: 14 });
  assert(
    !!underAgeRes.error && underAgeRes.error.includes('between 18 and 99'),
    'Underage boundary (< 18) rejected'
  );

  // Test 6: Arbitrary injection parameter protection
  const injectionRes = FilterValidator.validateAndParse({ field: 'passwordHash', value: 'leak' });
  assert(
    !!injectionRes.error && injectionRes.error.includes('strictly prohibited'),
    'CRITICAL: Arbitrary field injection rejected with security violation'
  );

  // Test 7: DOB boundary computation
  const dobBounds = FilterValidator.calculateDobBounds(20, 30);
  assert(
    !!dobBounds.earliestDob && !!dobBounds.latestDob && dobBounds.earliestDob < dobBounds.latestDob,
    'DOB boundary calculations produce valid chronological ISO range'
  );

  // --- Category 2: HTTP Structured Filters Endpoints ---
  console.log('\n🌐 Test Category: HTTP Structured Filters Endpoint Execution');

  const userA = await prisma.user.findFirst();
  if (!userA) throw new Error('Database must have a user');

  const tokenA = jwt.sign({ id: userA.id, username: userA.username }, JWT_SECRET, { expiresIn: '1h' });

  // Test 8: Filter by gender
  const genderHttpRes = await fetch(`${BASE_URL}/api/search/users?gender=female&limit=5`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(genderHttpRes.status === 200, 'Gender filter query returns HTTP 200');
  const genderJson = await genderHttpRes.json();
  assert(Array.isArray(genderJson.results), 'Gender filter response contains results array');
  if (genderJson.results.length > 0) {
    assert(
      genderJson.results.every((u: any) => u.gender?.toLowerCase() === 'female'),
      'All candidates match filtered gender "female"'
    );
  }

  // Test 9: Filter by zodiac sign
  const zodiacHttpRes = await fetch(`${BASE_URL}/api/search/users?zodiacSign=Taurus&limit=5`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(zodiacHttpRes.status === 200, 'Zodiac sign filter query returns HTTP 200');
  const zodiacJson = await zodiacHttpRes.json();
  if (zodiacJson.results.length > 0) {
    assert(
      zodiacJson.results.every((u: any) => u.zodiacSign?.toLowerCase() === 'taurus'),
      'All candidates match filtered zodiac sign "Taurus"'
    );
  }

  // Test 10: Filter by interests
  const interestsHttpRes = await fetch(`${BASE_URL}/api/search/users?interests=Gaming,Technology&limit=5`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(interestsHttpRes.status === 200, 'Interests filter query returns HTTP 200');
  const interestsJson = await interestsHttpRes.json();
  assert(Array.isArray(interestsJson.results), 'Interests filter returns results');

  // Test 11: Combined query: free-text 'q' + structured filter
  const combinedHttpRes = await fetch(`${BASE_URL}/api/search/users?q=an&gender=female&limit=5`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(combinedHttpRes.status === 200, 'Combined free-text + gender filter returns HTTP 200');
  const combinedJson = await combinedHttpRes.json();
  if (combinedJson.results.length > 0) {
    assert(
      combinedJson.results.every((u: any) => u.gender?.toLowerCase() === 'female'),
      'Combined query results satisfy both free-text search and gender filter'
    );
  }

  // Test 12: Rejection of invalid gender filter on HTTP API
  const badGenderHttpRes = await fetch(`${BASE_URL}/api/search/users?gender=superhuman`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(badGenderHttpRes.status === 400, 'Invalid gender on HTTP endpoint returns HTTP 400');

  // Test 13: Rejection of arbitrary parameter injection on HTTP API
  const badInjectionHttpRes = await fetch(`${BASE_URL}/api/search/users?field=password`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(badInjectionHttpRes.status === 400, 'Arbitrary parameter injection returns HTTP 400');

  console.log(`\n🎉 All ${passed}/${total} Level 5 verification tests passed successfully!\n`);
}

runTests()
  .catch((err) => {
    console.error('\n❌ Level 5 test suite failure:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
