import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  const result = await sql`SELECT * FROM time_entries ORDER BY date DESC`;
  return NextResponse.json(result.rows);
}

export async function POST(request) {
  const { date, client, description, hours, rate } = await request.json();
  const result = await sql`
    INSERT INTO time_entries (date, client, description, hours, rate, status)
    VALUES (${date}, ${client}, ${description}, ${hours}, ${rate || 250}, 'unbilled')
    RETURNING *
  `;
  return NextResponse.json(result.rows[0]);
}
