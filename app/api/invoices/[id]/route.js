import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const sql = getDb();
  const { id } = await params;
  const inv = await sql`SELECT * FROM invoices WHERE id=${id}`;
  if (!inv.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const items = await sql`SELECT * FROM time_entries WHERE invoice_id=${id} ORDER BY date ASC`;
  return NextResponse.json({ invoice: inv[0], items });
}

export async function PATCH(request, { params }) {
  const sql = getDb();
  const { id } = await params;
  const { status } = await request.json();
  await sql`UPDATE invoices SET status=${status} WHERE id=${id}`;
  if (status === 'paid') await sql`UPDATE time_entries SET status='paid' WHERE invoice_id=${id}`;
  if (status === 'sent') await sql`UPDATE time_entries SET status='invoiced' WHERE invoice_id=${id}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const sql = getDb();
  const { id } = await params;
  await sql`UPDATE time_entries SET status='unbilled', invoice_id=NULL WHERE invoice_id=${id}`;
  await sql`DELETE FROM invoices WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}
