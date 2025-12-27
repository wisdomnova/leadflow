type Entry = { count: number; resetAt: number }

const buckets: Map<string, Entry> = new Map()

export function rateLimit({ key, limit, windowMs }: { key: string; limit: number; windowMs: number }) {
  const now = Date.now()
  const entry = buckets.get(key)
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  entry.count += 1
  buckets.set(key, entry)
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}
