import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  const result = await sql`SELECT * FROM tasks ORDER BY 
    CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
    created_at ASC`;
  return NextResponse.json(result.rows);
}

export async function POST(request) {
  const { project, title, priority, due_date } = await request.json();
  const result = await sql`
    INSERT INTO tasks (project, title, priority, due_date)
    VALUES (${project}, ${title}, ${priority || 'medium'}, ${due_date || null})
    RETURNING *
  `;
  return NextResponse.json(result.rows[0]);
}

export async function PATCH(request) {
  const { id, status } = await request.json();
  await sql`UPDATE tasks SET status = ${status} WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  await sql`DELETE FROM tasks WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
