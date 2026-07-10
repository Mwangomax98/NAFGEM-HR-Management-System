import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://harmony:harmony@localhost:5432/harmony_hr';

async function main() {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const seed = fs.readFileSync(path.join(__dirname, '../db/seed.sql'), 'utf8');
    await client.query(seed);
    console.log('Seed applied successfully');
    console.log('Stub admin id: 00000000-0000-4000-8000-000000000001');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err.message || err);
  if (err.code === 'ECONNREFUSED') {
    console.error('Is Postgres running? Try: npm run db:up  (requires Docker)');
  }
  process.exit(1);
});
