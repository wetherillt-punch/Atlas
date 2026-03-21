import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const id = params.id;
  const invoice = await sql`SELECT * FROM invoices WHERE id = ${id}`;
  if (invoice.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const items = await sql`SELECT * FROM time_entries WHERE invoice_id = ${id} ORDER BY date ASC`;
  return NextResponse.json({ invoice: invoice.rows[0], items: items.rows });
}

export async function PATCH(request, { params }) {
  const id = params.id;
  const { status } = await request.json();
  await sql`UPDATE invoices SET status = ${status} WHERE id = ${id}`;
  if (status === 'paid') {
    await sql`UPDATE time_entries SET status = 'paid' WHERE invoice_id = ${id}`;
  }
  return NextResponse.json({ ok: true });
}
