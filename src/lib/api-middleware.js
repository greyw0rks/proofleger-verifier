/**
 * ProofLedger Verifier API Middleware
 * Compose rate limiting, cache headers, and CORS
 */
import { rateLimiter } from "./rate-limiter.js";

export function applyMiddleware(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return false; // signal: stop processing
  }

  // Rate limiting
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
    || req.socket?.remoteAddress
    || "unknown";

  const rl = rateLimiter.check(ip);
  res.setHeader("X-RateLimit-Remaining", rl.remaining);
  res.setHeader("X-RateLimit-Reset",     Math.ceil(rl.resetAt / 1000));

  if (!rl.allowed) {
    res.setHeader("Retry-After", Math.ceil((rl.resetAt - Date.now()) / 1000));
    res.statusCode = 429;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Rate limit exceeded" }));
    return false;
  }

  res.setHeader("Content-Type", "application/json");
  return true; // signal: continue
}

export function setCacheHeader(res, ttlSeconds = 30) {
  res.setHeader("Cache-Control", `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`);
}

export function setNoCacheHeader(res) {
  res.setHeader("Cache-Control", "no-store");
}