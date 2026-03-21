import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  const result = await sql`SELECT * FROM invoices ORDER BY created_at DESC`;
  return NextResponse.json(result.rows);
}

export async function POST(request) {
  const { client } = await request.json();
  
  // Get unbilled hours for this client
  const unbilled = await sql`
    SELECT * FROM time_entries 
    WHERE client = ${client} AND status = 'unbilled' 
    ORDER BY date ASC
  `;
  
  if (unbilled.rows.length === 0) {
    return NextResponse.json({ error: 'No unbilled hours' }, { status: 400 });
  }
  
  const totalHours = unbilled.rows.reduce((s, r) => s + parseFloat(r.hours), 0);
  const totalAmount = unbilled.rows.reduce((s, r) => s + parseFloat(r.hours) * parseFloat(r.rate), 0);
  
  // Get next invoice number
  const countResult = await sql`SELECT COUNT(*) FROM invoices`;
  const num = `BHA-${String(parseInt(countResult.rows[0].count) + 1).padStart(3, '0')}`;
  
  // Create invoice
  const today = new Date().toISOString().split('T')[0];
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const invoice = await sql`
    INSERT INTO invoices (number, client, hours, amount, date_sent, due_date, status)
    VALUES (${num}, ${client}, ${totalHours}, ${totalAmount}, ${today}, ${dueDate}, 'sent')
    RETURNING *
  `;
  
  // Mark time entries as invoiced
  await sql`
    UPDATE time_entries SET status = 'invoiced', invoice_id = ${invoice.rows[0].id}
    WHERE client = ${client} AND status = 'unbilled'
  `;
  
  return NextResponse.json({ invoice: invoice.rows[0], items: unbilled.rows });
}
