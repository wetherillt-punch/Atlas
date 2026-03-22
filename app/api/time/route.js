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
