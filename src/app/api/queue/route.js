import { NextResponse } from 'next/server';
import { query } from '../../../lib/db.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { rows } = await query(
    "SELECT id, code, status, created_at FROM tickets WHERE status = 'waiting' ORDER BY id ASC LIMIT 20"
  );
  const counts = await query(
    "SELECT count(*)::int AS count FROM tickets WHERE status = 'waiting'"
  );
  return NextResponse.json({ count: counts.rows[0].count, tickets: rows });
}
