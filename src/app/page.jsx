'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'waiting-room-client-id';

function readClientId() {
  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = window.crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export default function Home() {
  const [clientId, setClientId] = useState(null);
  const [mine, setMine] = useState(null);
  const [queue, setQueue] = useState({ count: 0, tickets: [] });
  const [version, setVersion] = useState('local');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (id) => {
    const [mineRes, queueRes, healthRes] = await Promise.all([
      fetch(`/api/tickets?clientId=${encodeURIComponent(id)}`, { cache: 'no-store' }),
      fetch('/api/queue', { cache: 'no-store' }),
      fetch('/health', { cache: 'no-store' }),
    ]);
    if (!mineRes.ok || !queueRes.ok) throw new Error('The waiting room is unavailable');
    setMine(await mineRes.json());
    setQueue(await queueRes.json());
    if (healthRes.ok) {
      const health = await healthRes.json();
      if (health.version) setVersion(health.version);
    }
  }, []);

  useEffect(() => {
    const id = readClientId();
    setClientId(id);
    load(id)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (!clientId) return undefined;
    const timer = setInterval(() => {
      load(clientId).catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [clientId, load]);

  async function join() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      if (!res.ok) throw new Error('Could not join the queue. Please try again.');
      await load(clientId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function serveNext() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/tickets/serve', { method: 'POST' });
      if (!res.ok) throw new Error('Could not serve the next visitor. Please try again.');
      await load(clientId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const status = mine?.ticket?.status || 'new';

  return (
    <main className="shell">
      <header className="intro">
        <h1>Waiting Room</h1>
        <p className="lede">
          Take a ticket, watch your position, and let the desk call the next visitor.
        </p>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="retry"
            onClick={() => clientId && load(clientId).then(() => setError('')).catch(() => {})}
          >
            Retry
          </button>
        </div>
      )}

      <section className="grid" aria-busy={loading}>
        <div className="card">
          <div className="card-head">
            <h2>Your ticket</h2>
            <span className={`pill ${status === 'waiting' ? 'pill-live' : ''}`}>{status}</span>
          </div>

          <div className="ticket-region" aria-live="polite">
            {loading ? (
              <p className="empty">Loading your ticket…</p>
            ) : mine?.ticket ? (
              <div className="ticket" key={mine.ticket.id}>
                <div className="ticket-code">{mine.ticket.code}</div>
                <div className="ticket-meta">
                  <div><span>Position</span><strong>{mine.position}</strong></div>
                  <div><span>Estimated wait</span><strong>~{mine.estimatedWaitMinutes} min</strong></div>
                  <div><span>Status</span><strong>{mine.ticket.status}</strong></div>
                </div>
              </div>
            ) : (
              <p className="empty">You have no ticket yet. Join the queue to get one.</p>
            )}
          </div>

          <button className="button" type="button" onClick={join} disabled={busy || status === 'waiting'}>
            {status === 'waiting' ? 'Already in queue' : 'Join the queue'}
          </button>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Live queue</h2>
            <span className={`pill ${queue.count > 0 ? 'pill-live' : ''}`}>{queue.count} waiting</span>
          </div>

          <ul className="queue" aria-label="People waiting">
            {queue.tickets.length === 0 && <li className="empty">Nobody is waiting.</li>}
            {queue.tickets.map((ticket, index) => (
              <li key={ticket.id}>
                <span className="queue-pos">{index + 1}</span>
                <span className="queue-code">{ticket.code}</span>
                <span className="queue-since">{new Date(ticket.created_at).toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>

          <button className="button button-ghost" type="button" onClick={serveNext} disabled={busy || queue.count === 0}>
            Serve next visitor
          </button>
        </div>
      </section>

      <footer className="footer">
        <span>Health endpoint: <code>/health</code></span>
        <span>Version: <code>{version}</code></span>
      </footer>
    </main>
  );
}
