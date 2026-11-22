import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getPool, query } from '../../../lib/db.js';
import { estimateWaitMinutes, nextTicketNumber, ticketCode } from '../../../lib/queue.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const clientId = request.nextUrl.searchParams.get('clientId');
  if (!clientId) {
    return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
  }

  const mine = await query(
    'SELECT id, code, status, created_at FROM tickets WHERE client_id = $1 ORDER BY id DESC LIMIT 1',
    [clientId]
  );
  if (mine.rows.length === 0) {
    return NextResponse.json({ ticket: null, position: 0, estimatedWaitMinutes: 0 });
  }

  const ticket = mine.rows[0];
  const ahead = ticket.status === 'waiting'
    ? await query(
        "SELECT count(*)::int AS count FROM tickets WHERE status = 'waiting' AND id < $1",
        [ticket.id]
      )
    : { rows: [{ count: 0 }] };

  const position = ahead.rows[0].count + (ticket.status === 'waiting' ? 1 : 0);
  return NextResponse.json({
    ticket,
    position,
    estimatedWaitMinutes: estimateWaitMinutes(position),
    version: process.env.APP_VERSION || 'dev',
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const clientId = body.clientId || randomUUID();
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const latest = await client.query('SELECT code FROM tickets ORDER BY id DESC LIMIT 1');
    const code = ticketCode(nextTicketNumber(latest.rows));
    const inserted = await client.query(
      'INSERT INTO tickets (client_id, code) VALUES ($1, $2) RETURNING id, code, status, created_at',
      [clientId, code]
    );
    await client.query('COMMIT');

    const waiting = await client.query(
      "SELECT count(*)::int AS count FROM tickets WHERE status = 'waiting'"
    );
    return NextResponse.json(
      {
        ticket: inserted.rows[0],
        position: waiting.rows[0].count,
        estimatedWaitMinutes: estimateWaitMinutes(waiting.rows[0].count),
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
