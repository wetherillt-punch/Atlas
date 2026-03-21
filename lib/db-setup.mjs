import { sql } from '@vercel/postgres';

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
    recurring BOOLEAN DEFAULT FALSE,
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
    project TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    due_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  // Seed expenses
  const count = await sql`SELECT COUNT(*) FROM expenses`;
  if (parseInt(count.rows[0].count) === 0) {
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
    ];
    for (const [date,vendor,amount,entity,category] of seeds) {
      await sql`INSERT INTO expenses (date,vendor,amount,entity,category) VALUES (${date},${vendor},${amount},${entity},${category})`;
    }
  }

  // Seed tasks
  const taskCount = await sql`SELECT COUNT(*) FROM tasks`;
  if (parseInt(taskCount.rows[0].count) === 0) {
    console.log('Seeding tasks...');
    const tasks = [
      ['Findr Health','Prod/dev split + rename carrotly→findr-health','todo','critical'],
      ['Findr Health','Weekly check-in flow (Flutter)','todo','high'],
      ['Findr Health','Gather Monday demo feedback','todo','high'],
      ['Findr Health','MFP: ask 3 questions','todo','high'],
      ['Findr Health','HIPAA BAA compliance research','todo','medium'],
      ['BHA','Finalize v4 DRG doc for CPF','todo','critical'],
      ['BHA','Request claims data from ATRIO vendor','todo','high'],
      ['BHA','Find CPA before April 15','todo','critical'],
      ['BHA','Website design and launch','todo','medium'],
      ['BHA','LinkedIn profile + first posts','todo','medium'],
      ['Cabin/STR','Remodel planning (kitchen, floor, bath)','todo','high'],
      ['Cabin/STR','Propane heater replacement','todo','medium'],
      ['Cabin/STR','Find STR CPA','todo','medium'],
    ];
    for (const [project,title,status,priority] of tasks) {
      await sql`INSERT INTO tasks (project,title,status,priority) VALUES (${project},${title},${status},${priority})`;
    }
  }

  console.log('Database setup complete.');
}

setup().catch(console.error);
