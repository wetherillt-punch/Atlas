import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually for local execution
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
if (!url) {
  console.error('No database URL found. Run: vercel env pull .env.local');
  console.error('Then check .env.local for DATABASE_URL, POSTGRES_URL, or NEON_DATABASE_URL');
  process.exit(1);
}

const sql = neon(url);

async function setup() {
  console.log('Setting up ATLAS database...');

  await sql`CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    vendor TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    entity TEXT NOT NULL,
    category TEXT DEFAULT 'Other',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS time_entries (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    client TEXT NOT NULL,
    description TEXT NOT NULL,
    hours DECIMAL(4,1) NOT NULL,
    rate DECIMAL(8,2) DEFAULT 250.00,
    status TEXT DEFAULT 'unbilled',
    invoice_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    number TEXT NOT NULL,
    client TEXT NOT NULL,
    hours DECIMAL(5,1) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date_sent DATE,
    due_date DATE,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    done BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  // Seed expenses
  const expCount = await sql`SELECT COUNT(*) as c FROM expenses`;
  if (parseInt(expCount[0].c) === 0) {
    console.log('Seeding expenses...');
    const seeds = [
      ['2026-01-08','Railway',7.58,'Findr Health','Hosting'],
      ['2026-01-26','Vercel (Tim)',20.05,'Findr Health','Hosting'],
      ['2026-01-27','Anthropic API',100.00,'Findr Health','Software'],
      ['2026-01-30','Claude Max',100.00,'Shared','Software'],
      ['2026-01-31','Google Workspace',105.60,'Findr Health','Software'],
      ['2026-02-01','Apple iCloud',9.99,'Personal','Software'],
      ['2026-02-08','Railway',6.62,'Findr Health','Hosting'],
      ['2026-02-08','Vercel (Findr)',20.00,'Findr Health','Hosting'],
      ['2026-02-26','Vercel (Tim)',20.02,'Findr Health','Hosting'],
      ['2026-02-28','Claude Max',100.00,'Shared','Software'],
      ['2026-02-28','Google Workspace',105.60,'Findr Health','Software'],
      ['2026-03-08','Railway',5.41,'Findr Health','Hosting'],
      ['2026-03-08','Vercel (Findr)',20.00,'Findr Health','Hosting'],
      ['2026-03-21','Neon Postgres',0.03,'Findr Health','Hosting'],
    ];
    for (const [date,vendor,amount,entity,category] of seeds) {
      await sql`INSERT INTO expenses (date,vendor,amount,entity,category) VALUES (${date},${vendor},${amount},${entity},${category})`;
    }
  }

  // Seed tasks
  const taskCount = await sql`SELECT COUNT(*) as c FROM tasks`;
  if (parseInt(taskCount[0].c) === 0) {
    console.log('Seeding tasks...');
    const tasks = [
      'Prod/dev split + rename carrotly→findr-health',
      'Weekly check-in flow (Flutter)',
      'Gather Monday demo feedback',
      'MFP: ask 3 questions',
      'Finalize v4 DRG doc for CPF',
      'Request claims data from ATRIO vendor',
      'Find CPA — by April 15',
      'HIPAA BAA compliance research',
      'Website design and launch (BHA)',
      'LinkedIn profile + first posts (BHA)',
      'Remodel planning: kitchen, floor, bath',
      'Propane heater replacement',
      'Find STR CPA',
    ];
    for (const title of tasks) {
      await sql`INSERT INTO tasks (title) VALUES (${title})`;
    }
  }

  console.log('Done. Tables created and seeded.');
}

setup().catch(err => { console.error(err); process.exit(1); });
