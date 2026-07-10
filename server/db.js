import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const STUB_USER_ID = '00000000-0000-4000-8000-000000000001';

export const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgresql://harmony:harmony@localhost:5432/harmony_hr',
});
