/**
 * Shared itinerary state, stored in Upstash Redis over its REST API.
 *
 * Env (Vercel → Settings → Environment Variables):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *   TRIP_KEY          optional, defaults to "trip:italy2026"
 *
 * With no env vars this returns 501 and the app falls back to localStorage,
 * so the site still works — it just isn't shared.
 *
 * GET  -> { rev, data }
 * PUT  { rev, data } -> { rev }   409 + { rev, data } if someone saved first
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = process.env.TRIP_KEY ?? 'trip:italy2026';

/** A trip board is a few KB; anything larger is a bug or abuse. */
const MAX_BYTES = 256 * 1024;

interface TripDoc {
  rev: number;
  data: Record<string, unknown>;
}

type RedisCommand = [string, ...string[]];

async function redis(command: RedisCommand): Promise<unknown> {
  const res = await fetch(REST_URL as string, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REST_TOKEN as string}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  const body = (await res.json()) as { result?: unknown };
  return body.result;
}

async function readDoc(): Promise<TripDoc> {
  const raw = await redis(['GET', KEY]);
  if (typeof raw !== 'string' || raw === '') return { rev: 0, data: {} };

  try {
    const parsed = JSON.parse(raw) as Partial<TripDoc>;
    return {
      rev: Number(parsed.rev) || 0,
      data: isRecord(parsed.data) ? parsed.data : {},
    };
  } catch {
    return { rev: 0, data: {} };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');

  if (!REST_URL || !REST_TOKEN) {
    res.status(501).json({
      error: 'no-backend',
      hint: 'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN',
    });
    return;
  }

  try {
    if (req.method === 'GET') {
      res.status(200).json(await readDoc());
      return;
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body as unknown);
      if (!isRecord(body) || !isRecord(body.data)) {
        res.status(400).json({ error: 'bad-body' });
        return;
      }

      const serialized = JSON.stringify(body.data);
      if (Buffer.byteLength(serialized, 'utf8') > MAX_BYTES) {
        res.status(413).json({ error: 'too-large' });
        return;
      }

      const current = await readDoc();
      const clientRev = Number(body.rev);
      if (!Number.isFinite(clientRev) || clientRev !== current.rev) {
        res.status(409).json(current); // stale write — hand back the truth
        return;
      }

      const next: TripDoc = { rev: current.rev + 1, data: body.data };
      await redis(['SET', KEY, JSON.stringify(next)]);
      res.status(200).json({ rev: next.rev });
      return;
    }

    res.setHeader('Allow', 'GET, PUT');
    res.status(405).json({ error: 'method-not-allowed' });
  } catch (err) {
    // log the detail, return none — the Upstash URL and token must not leak
    console.error('state handler failed:', err);
    res.status(500).json({ error: 'server-error' });
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
