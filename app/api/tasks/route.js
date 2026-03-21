import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const sql = getDb();
  return NextResponse.json(await sql`SELECT * FROM tasks ORDER BY done ASC, created_at ASC`);
}

export async function POST(request) {
  const sql = getDb();
  const { title, project } = await request.json();
  if (!title?.trim()) return NextResponse.json({ error: 'No title' }, { status: 400 });
  const rows = await sql`INSERT INTO tasks (title, project) VALUES (${title.trim()}, ${project || null}) RETURNING *`;
  return NextResponse.json(rows[0]);
}

export async function PATCH(request) {
  const sql = getDb();
  const { id, done } = await request.json();
  await sql`UPDATE tasks SET done=${done} WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const sql = getDb();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (id === 'completed') {
    await sql`DELETE FROM tasks WHERE done=true`;
  } else {
    await sql`DELETE FROM tasks WHERE id=${id}`;
  }
  return NextResponse.json({ ok: true });
}
