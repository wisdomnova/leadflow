/**
 * Simple in-memory sliding-window rate limiter.
 * 
 * For production at scale, replace with Redis-based solution.
 * This works for single-instance / serverless cold-start scenarios.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

interface RateLimitOptions {
  /** Time window in milliseconds */
  windowMs: number;
  /** Max requests per window */
  maxRequests: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const { windowMs, maxRequests } = options;

  cleanup(windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(retryAfterMs, 0),
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    retryAfterMs: 0,
  };
}

/**
 * Pre-configured rate limiters for common use cases.
 * NOTE: This is an in-memory store that resets on cold starts.
 * TODO: Migrate to Redis/Upstash for persistent rate limiting in production.
 */
export const rateLimiters = {
  /** Auth endpoints: 5 requests per 15 minutes per IP */
  auth: (ip: string) =>
    checkRateLimit(`auth:${ip}`, { windowMs: 15 * 60 * 1000, maxRequests: 5 }),

  /** Signup: 3 requests per 15 minutes per IP */
  signup: (ip: string) =>
    checkRateLimit(`signup:${ip}`, { windowMs: 15 * 60 * 1000, maxRequests: 3 }),

  /** Password reset: 3 requests per 15 minutes per IP */
  passwordReset: (ip: string) =>
    checkRateLimit(`pwreset:${ip}`, { windowMs: 15 * 60 * 1000, maxRequests: 3 }),

  /** General API: 100 requests per minute per user */
  api: (userId: string) =>
    checkRateLimit(`api:${userId}`, { windowMs: 60 * 1000, maxRequests: 100 }),

  /** Team join: 5 requests per 15 minutes per IP */
  teamJoin: (ip: string) =>
    checkRateLimit(`teamjoin:${ip}`, { windowMs: 15 * 60 * 1000, maxRequests: 5 }),

  /** Bulk import: 10 requests per hour per org */
  bulkImport: (orgId: string) =>
    checkRateLimit(`import:${orgId}`, { windowMs: 60 * 60 * 1000, maxRequests: 10 }),

  /** AI operations: 30 requests per minute per user (OpenAI cost protection) */
  ai: (userId: string) =>
    checkRateLimit(`ai:${userId}`, { windowMs: 60 * 1000, maxRequests: 30 }),

  /** Email sync: 10 requests per minute per user */
  emailSync: (userId: string) =>
    checkRateLimit(`sync:${userId}`, { windowMs: 60 * 1000, maxRequests: 10 }),

  /** Email sending: 60 requests per hour per user */
  emailSend: (userId: string) =>
    checkRateLimit(`send:${userId}`, { windowMs: 60 * 60 * 1000, maxRequests: 60 }),

  /** Tracking pixels: 100 requests per minute per IP (abuse prevention) */
  tracking: (ip: string) =>
    checkRateLimit(`track:${ip}`, { windowMs: 60 * 1000, maxRequests: 100 }),
};

/**
 * Helper to extract client IP from request headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
