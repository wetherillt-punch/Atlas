import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const sql = getDb();
  return NextResponse.json(await sql`SELECT * FROM time_entries ORDER BY date DESC`);
}

export async function POST(request) {
  const sql = getDb();
  const { date, client, description, hours, rate } = await request.json();
  const r = rate || 275;
  const rows = await sql`INSERT INTO time_entries (date,client,description,hours,rate,status) VALUES (${date},${client},${description},${hours},${r},'unbilled') RETURNING *`;
  return NextResponse.json(rows[0]);
}

export async function PATCH(request) {
  const sql = getDb();
  const { id, date, client, description, hours, rate } = await request.json();
  const rows = await sql`UPDATE time_entries SET date=${date}, client=${client}, description=${description}, hours=${hours}, rate=${rate} WHERE id=${id} RETURNING *`;
  return NextResponse.json(rows[0]);
}

export async function DELETE(request) {
  const sql = getDb();
  const { searchParams } = new URL(request.url);
  await sql`DELETE FROM time_entries WHERE id = ${searchParams.get('id')}`;
  return NextResponse.json({ ok: true });
}
