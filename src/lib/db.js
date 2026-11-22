import { Pool } from 'pg';

let pool;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not set');
    pool = new Pool({ connectionString, max: 10 });
  }
  return pool;
}

export async function query(text, params = []) {
  return getPool().query(text, params);
}
