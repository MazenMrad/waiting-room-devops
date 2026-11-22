import { NextResponse } from 'next/server';
import { query } from '../../lib/db.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await query('SELECT 1');
    return NextResponse.json({
      status: 'ok',
      db: 'ok',
      version: process.env.APP_VERSION || 'dev',
    });
  } catch {
    return NextResponse.json({ status: 'error', db: 'unavailable' }, { status: 503 });
  }
}
