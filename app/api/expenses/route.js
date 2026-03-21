import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const entity = searchParams.get('entity');
  
  let result;
  if (entity && entity !== 'All') {
    result = await sql`SELECT * FROM expenses WHERE entity = ${entity} ORDER BY date DESC`;
  } else {
    result = await sql`SELECT * FROM expenses ORDER BY date DESC`;
  }
  return NextResponse.json(result.rows);
}

export async function POST(request) {
  const body = await request.json();
  const { date, vendor, amount, entity, category, notes } = body;
  
  const result = await sql`
    INSERT INTO expenses (date, vendor, amount, entity, category, notes)
    VALUES (${date}, ${vendor}, ${amount}, ${entity}, ${category || 'Other'}, ${notes || null})
    RETURNING *
  `;
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  await sql`DELETE FROM expenses WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
