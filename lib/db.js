import { neon } from '@neondatabase/serverless';

export function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
  if (!url) throw new Error('No database connection string found. Check env vars: DATABASE_URL, POSTGRES_URL, or NEON_DATABASE_URL');
  return neon(url);
}
