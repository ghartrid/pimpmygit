import { timingSafeEqual } from "crypto";

// Simple in-memory rate limiter for single-instance deployment
const hits = new Map<string, number[]>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of hits) {
    const filtered = timestamps.filter((t) => now - t < 3600000);
    if (filtered.length === 0) hits.delete(key);
    else hits.set(key, filtered);
  }
}, 300000);

export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const timestamps = hits.get(key) || [];
  const windowStart = now - windowMs;
  const recent = timestamps.filter((t) => t > windowStart);

  if (recent.length >= maxRequests) {
    return { ok: false, remaining: 0 };
  }

  recent.push(now);
  hits.set(key, recent);
  return { ok: true, remaining: maxRequests - recent.length };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export function checkAdminAuth(req: Request): boolean {
  const auth = req.headers.get("authorization");
  const token = process.env.ADMIN_TOKEN;
  if (!token || !auth) return false;
  const expected = `Bearer ${token}`;
  if (auth.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
}
