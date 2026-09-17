import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ginivibe' });
async function main() {
  const res = await pool.query('SELECT * FROM "User"');
  console.log('Users:', res.rows);
  const res2 = await pool.query('SELECT * FROM "Character"');
  console.log('Characters:', res2.rows);
}
main().catch(console.error).finally(() => pool.end());
