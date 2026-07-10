import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://harmony:harmony@localhost:5432/harmony_hr';

async function runSql(client, filename) {
  const filePath = path.join(__dirname, '../db', filename);
  if (!fs.existsSync(filePath)) return;
  const sql = fs.readFileSync(filePath, 'utf8');
  await client.query(sql);
  console.log(`Applied ${filename}`);
}

async function main() {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await runSql(client, 'schema.sql');
    await runSql(client, 'migrate_v2_enums.sql');
    await runSql(client, 'migrate_v2_roles.sql');
    await runSql(client, 'migrate_v2.sql');
    await runSql(client, 'migrate_v3.sql');
    await runSql(client, 'migrate_v4.sql');
    await runSql(client, 'migrate_v5.sql');
    console.log('Migration completed successfully');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message || err);
  if (err.code === 'ECONNREFUSED') {
    console.error('Is Postgres running? Try: npm run db:up');
  }
  process.exit(1);
});
