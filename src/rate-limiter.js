/**
 * ProofLedger Verifier Rate Limiter
 * Per-IP sliding window rate limiting with configurable thresholds
 */

export class RateLimiter {
  constructor(windowMs = 60_000, maxRequests = 60) {
    this.windowMs    = windowMs;
    this.maxRequests = maxRequests;
    this.requests    = new Map(); // ip -> [timestamp, ...]
    this.blocked     = new Map(); // ip -> blockedUntil
  }

  // Returns { allowed: bool, remaining: int, resetAt: timestamp }
  check(ip) {
    const now        = Date.now();
    const windowStart = now - this.windowMs;

    // Clear expired block
    if (this.blocked.has(ip) && this.blocked.get(ip) < now) {
      this.blocked.delete(ip);
    }
    if (this.blocked.has(ip)) {
      return { allowed: false, remaining: 0, resetAt: this.blocked.get(ip) };
    }

    // Prune old timestamps
    const times = (this.requests.get(ip) || []).filter(t => t > windowStart);
    times.push(now);
    this.requests.set(ip, times);

    const remaining = Math.max(0, this.maxRequests - times.length);
    if (times.length > this.maxRequests) {
      const blockUntil = now + this.windowMs;
      this.blocked.set(ip, blockUntil);
      return { allowed: false, remaining: 0, resetAt: blockUntil };
    }

    return { allowed: true, remaining, resetAt: windowStart + this.windowMs };
  }

  reset(ip) {
    this.requests.delete(ip);
    this.blocked.delete(ip);
  }

  stats() {
    return {
      trackedIPs: this.requests.size,
      blockedIPs: this.blocked.size,
      windowMs:   this.windowMs,
      maxRequests: this.maxRequests,
    };
  }
}

// Singleton — 60 requests per minute per IP
export const rateLimiter = new RateLimiter(60_000, 60);

// Express/http middleware helper
export function rateLimitMiddleware(req, res, next) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
    || req.socket?.remoteAddress
    || "unknown";

  const result = rateLimiter.check(ip);

  if (!result.allowed) {
    res.setHeader("Retry-After", Math.ceil((result.resetAt - Date.now()) / 1000));
    res.statusCode = 429;
    res.end(JSON.stringify({ error: "Rate limit exceeded", resetAt: result.resetAt }));
    return;
  }

  res.setHeader("X-RateLimit-Remaining", result.remaining);
  next?.();
  return result;
}