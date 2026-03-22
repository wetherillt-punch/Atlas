import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const sql = getDb();
  return NextResponse.json(await sql`SELECT * FROM invoices ORDER BY created_at DESC`);
}

export async function POST(request) {
  const sql = getDb();
  const { client, month } = await request.json();
  
  let unbilled;
  if (month) {
    const startDate = `${month}-01`;
    const [y, m] = month.split('-');
    const endDate = `${y}-${String(parseInt(m) + 1).padStart(2, '0')}-01`;
    unbilled = await sql`SELECT * FROM time_entries WHERE client=${client} AND status='unbilled' AND date >= ${startDate}::date AND date < ${endDate}::date ORDER BY date ASC`;
  } else {
    unbilled = await sql`SELECT * FROM time_entries WHERE client=${client} AND status='unbilled' ORDER BY date ASC`;
  }
  
  if (!unbilled.length) return NextResponse.json({ error: 'No unbilled hours' }, { status: 400 });
  
  const totalH = unbilled.reduce((s, r) => s + parseFloat(r.hours), 0);
  const totalA = unbilled.reduce((s, r) => s + parseFloat(r.hours) * parseFloat(r.rate), 0);
  const cnt = await sql`SELECT COUNT(*) as c FROM invoices`;
  const num = `BHA-${String(parseInt(cnt[0].c) + 1).padStart(3, '0')}`;
  const today = new Date().toISOString().split('T')[0];
  const due = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];
  
  const inv = await sql`INSERT INTO invoices (number,client,hours,amount,date_sent,due_date,status) VALUES (${num},${client},${totalH},${totalA},${today},${due},'sent') RETURNING *`;
  
  const ids = unbilled.map(r => r.id);
  for (const id of ids) {
    await sql`UPDATE time_entries SET status='invoiced', invoice_id=${inv[0].id} WHERE id=${id}`;
  }
  
  return NextResponse.json({ invoice: inv[0], items: unbilled });
}
