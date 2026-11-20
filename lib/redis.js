// Minimal Upstash REST client. Only anonymous counts and timestamps are stored.
// UPSTASH_REDIS_REST_TOKEN is used on the server only, never in browser code.
export async function redisCommands(commands, { atomic = false } = {}) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    const error = new Error('قاعدة بيانات الزيارات غير متصلة. وصّل Upstash Redis بالمشروع على Vercel ثم اعمل Redeploy.');
    error.code = 'STORAGE_NOT_CONFIGURED';
    throw error;
  }
  const response = await fetch(`${url.replace(/\/$/, '')}/${atomic ? 'multi-exec' : 'pipeline'}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(9000)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(data) || data.some(entry => entry.error)) {
    throw new Error('تعذر الاتصال بقاعدة الزيارات');
  }
  return data.map(entry => entry.result);
}

export function cairoDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const record = Object.fromEntries(parts.filter(x => x.type !== 'literal').map(x => [x.type,x.value]));
  return `${record.year}-${record.month}-${record.day}`;
}

export function lastDays(count) {
  const [year, month, day] = cairoDay().split('-').map(Number);
  return Array.from({ length: count }, (_, index) => {
    const diff = count - index - 1;
    return new Date(Date.UTC(year, month - 1, day - diff, 12)).toISOString().slice(0, 10);
  });
}
