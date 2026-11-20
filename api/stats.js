import { timingSafeEqual } from 'node:crypto';
import { redisCommands, cairoDay, lastDays } from '../lib/redis.js';

function validKey(given, expected) {
  if (typeof given !== 'string' || !expected) return false;
  const one = Buffer.from(given, 'utf8');
  const two = Buffer.from(expected, 'utf8');
  return one.length === two.length && timingSafeEqual(one, two);
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Pragma', 'no-cache');
  response.setHeader('Vary', 'x-admin-key');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }
  const key = process.env.ADMIN_KEY;
  if (!key || key.length < 16) {
    return response.status(503).json({ error: 'ADMIN_KEY مش متظبط. ضيف مفتاح 16 حرف على الأقل في Environment Variables على Vercel واعمل Redeploy.' });
  }
  if (!validKey(request.headers['x-admin-key'], key)) {
    return response.status(401).json({ error: 'مفتاح الأدمن غير صحيح' });
  }
  try {
    const days = lastDays(14);
    const data = await redisCommands([
      ['GET', 'letter:total'],
      ['MGET', ...days.map(day => `letter:day:${day}`)],
      ['LRANGE', 'letter:recent', 0, 11]
    ]);
    const numbers = Array.isArray(data[1]) ? data[1] : [];
    const series = days.map((date, i) => ({ date, count: Number(numbers[i]) || 0 }));
    const recent = (Array.isArray(data[2]) ? data[2] : [])
      .map(value => Number(value))
      .filter(value => Number.isFinite(value) && value > 0)
      .map(value => new Date(value).toISOString());
    return response.status(200).json({
      total: Number(data[0]) || 0,
      today: series.at(-1)?.count || 0,
      latest: recent[0] || null,
      recent, series,
      timezone: 'Africa/Cairo',
      caveat: 'Anonymous page-open sessions only. Does not identify people or prove a message was read.'
    });
  } catch (error) {
    console.error('stats failed:', error.code || error.message);
    if (error.code === 'STORAGE_NOT_CONFIGURED') return response.status(503).json({ error: error.message });
    return response.status(503).json({ error: 'خدمة الإحصائيات غير متاحة مؤقتًا. راجع اتصال Upstash.' });
  }
}
