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

  // Seed 2025 expenses if not present
  const has2025 = await sql`SELECT COUNT(*) as c FROM expenses WHERE date < '2026-01-01'`;
  if (parseInt(has2025[0].c) === 0) {
    console.log('Seeding 2025 Findr Health expenses...');
    const exp2025 = [
      ['2025-02-26','GoDaddy','Domain',44.53,'Findr Health'],
      ['2025-04-23','GoDaddy','Domain',759.14,'Findr Health'],
      ['2025-04-23','Trademark Engine','Legal/IP',99.00,'Findr Health'],
      ['2025-04-23','Trademark Engine','Legal/IP',248.00,'Findr Health'],
      ['2025-04-24','Trademark Engine','Legal/IP',99.00,'Findr Health'],
      ['2025-04-24','NV Secretary of State','Legal/Filing',125.00,'Findr Health'],
      ['2025-04-25','NV Secretary of State','Legal/Filing',743.13,'Findr Health'],
      ['2025-04-26','Trademark Engine','Legal/IP',350.00,'Findr Health'],
      ['2025-04-26','Trademark Engine','Legal/IP',60.00,'Findr Health'],
      ['2025-04-29','Cake','Software',480.00,'Findr Health'],
      ['2025-05-03','Trademark Engine','Legal/IP',175.00,'Findr Health'],
      ['2025-05-03','Trademark Engine','Legal/IP',175.00,'Findr Health'],
      ['2025-05-05','Apple Developer','Software',98.99,'Findr Health'],
      ['2025-05-16','Chamberlain MCH Legal','Legal',2575.00,'Findr Health'],
      ['2025-05-27','MT Secretary of State','Legal/Filing',90.00,'Findr Health'],
      ['2025-05-30','Upwork','Contractor',525.00,'Findr Health'],
      ['2025-05-30','Upwork','Contractor',1050.00,'Findr Health'],
      ['2025-05-30','Upwork','Contractor',3684.99,'Findr Health'],
      ['2025-06-24','Legal counsel','Legal',1000.00,'Findr Health'],
      ['2025-06-30','NV Secretary of State','Legal/Filing',179.38,'Findr Health'],
      ['2025-11-26','Vercel (Tim)','Hosting',20.00,'Findr Health'],
      ['2025-11-28','DTeam LLC','Contractor',6000.00,'Findr Health'],
      ['2025-12-01','Vercel (Neon)','Hosting',7.43,'Findr Health'],
      ['2025-12-26','Vercel (Tim)','Hosting',20.00,'Findr Health'],
      ['2025-12-30','Claude Max (40%)','Software',40.00,'Findr Health'],
      ['2025-11-30','Claude Max (40%)','Software',1.36,'Findr Health'],
      ['2025-01-01','Michael (contractor)','Contractor',1120.00,'Findr Health'],
      // Shared 2025
      ['2025-11-30','Claude Max','Software',3.39,'Shared'],
      ['2025-12-30','Claude Max','Software',100.00,'Shared'],
    ];
    for (const [date,vendor,category,amount,entity] of exp2025) {
      await sql`INSERT INTO expenses (date,vendor,amount,entity,category) VALUES (${date},${vendor},${amount},${entity},${category})`;
    }
    console.log(`Seeded ${exp2025.length} expenses for 2025.`);
  } else {
    console.log('2025 expenses already present, skipping.');
  }

  console.log('Done.');
}

setup().catch(err => { console.error(err); process.exit(1); });
