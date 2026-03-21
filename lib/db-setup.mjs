import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve } from 'path';

try {
  const envPath = resolve(process.cwd(), '.env.local');
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && !key.startsWith('#') && vals.length) {
      process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
} catch {}

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
if (!url) { console.error('No database URL found. Run: vercel env pull .env.local'); process.exit(1); }
const sql = neon(url);

async function setup() {
  console.log('Updating ATLAS database...');

  await sql`CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY, date DATE NOT NULL, vendor TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL, entity TEXT NOT NULL,
    category TEXT DEFAULT 'Other', notes TEXT, created_at TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS time_entries (
    id SERIAL PRIMARY KEY, date DATE NOT NULL, client TEXT NOT NULL,
    description TEXT NOT NULL, hours DECIMAL(4,1) NOT NULL,
    rate DECIMAL(8,2) DEFAULT 250.00, status TEXT DEFAULT 'unbilled',
    invoice_id INTEGER, created_at TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY, number TEXT NOT NULL, client TEXT NOT NULL,
    hours DECIMAL(5,1) NOT NULL, amount DECIMAL(10,2) NOT NULL,
    date_sent DATE, due_date DATE, status TEXT DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, project TEXT,
    done BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW()
  )`;

  try { await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project TEXT`; } catch {}

  // Clear old seeded tasks
  const deleted = await sql`DELETE FROM tasks WHERE title LIKE '%carrotly%' OR title LIKE '%check-in flow%' OR title LIKE '%demo feedback%' OR title LIKE '%MFP:%' OR title LIKE '%DRG doc%' OR title LIKE '%claims data%' OR title LIKE '%CPA%' OR title LIKE '%HIPAA%' OR title LIKE '%Website design%' OR title LIKE '%LinkedIn%' OR title LIKE '%Remodel%' OR title LIKE '%heater%' OR title LIKE '%STR CPA%'`;
  console.log('Cleared old seeded tasks.');
  console.log('Done. Tasks start empty — your list, your words.');
}

setup().catch(err => { console.error(err); process.exit(1); });
