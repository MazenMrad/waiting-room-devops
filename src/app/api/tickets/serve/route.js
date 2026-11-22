import { NextResponse } from 'next/server';
import { getPool } from '../../../../lib/db.js';
import { canServe } from '../../../../lib/queue.js';

export const dynamic = 'force-dynamic';

export async function POST() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const next = await client.query(
      "SELECT id, code, status FROM tickets WHERE status = 'waiting' ORDER BY id ASC LIMIT 1 FOR UPDATE SKIP LOCKED"
    );
    if (next.rows.length === 0 || !canServe(next.rows[0].status)) {
      await client.query('ROLLBACK');
      return NextResponse.json({ served: null }, { status: 404 });
    }
    const served = await client.query(
      'UPDATE tickets SET status = $1, served_at = now() WHERE id = $2 RETURNING id, code, status, served_at',
      ['served', next.rows[0].id]
    );
    await client.query('COMMIT');
    return NextResponse.json({ served: served.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
