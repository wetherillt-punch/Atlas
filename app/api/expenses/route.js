import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const sql = getDb();
  const { searchParams } = new URL(request.url);
  const entity = searchParams.get('entity');
  const rows = entity && entity !== 'All'
    ? await sql`SELECT * FROM expenses WHERE entity = ${entity} ORDER BY date DESC`
    : await sql`SELECT * FROM expenses ORDER BY date DESC`;
  return NextResponse.json(rows);
}

export async function POST(request) {
  const sql = getDb();
  const { date, vendor, amount, entity, category } = await request.json();
  const rows = await sql`INSERT INTO expenses (date,vendor,amount,entity,category) VALUES (${date},${vendor},${amount},${entity},${category || 'Other'}) RETURNING *`;
  return NextResponse.json(rows[0]);
}

export async function DELETE(request) {
  const sql = getDb();
  const { searchParams } = new URL(request.url);
  await sql`DELETE FROM expenses WHERE id = ${searchParams.get('id')}`;
  return NextResponse.json({ ok: true });
}
