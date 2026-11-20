import { redisCommands, cairoDay } from '../lib/redis.js';

const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8' };

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }
  // Browser submissions must originate on the same origin as the letter.
  const origin = request.headers.origin;
  const host = request.headers['x-forwarded-host'] || request.headers.host;
  if (origin && new URL(origin).host !== host) {
    return response.status(403).json({ error: 'Forbidden' });
  }
  try {
    const timestamp = String(Date.now());
    const day = cairoDay();
    await redisCommands([
      ['INCR', 'letter:total'],
      ['INCR', `letter:day:${day}`],
      ['LPUSH', 'letter:recent', timestamp],
      ['LTRIM', 'letter:recent', 0, 19]
    ], { atomic: true });
    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('visit tracking failed:', error.code || error.message);
    return response.status(503).json({ ok: false, error: 'Tracking is not configured' });
  }
}
