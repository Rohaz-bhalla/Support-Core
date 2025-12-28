type RateLimitEntry = {
  count: number;
  lastReset: number;
};

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20;

const rateLimitMap = new Map<string, RateLimitEntry>();

export function rateLimit(ip: string) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return { allowed: true };
  }

  if (now - entry.lastReset > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false };
  }

  entry.count += 1;
  return { allowed: true };
}
