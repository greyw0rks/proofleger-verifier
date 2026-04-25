/**
 * ProofLedger Verifier In-Memory Cache
 * Lightweight LRU-ish cache to deduplicate read-heavy API responses
 */

export class Cache {
  constructor(maxSize = 500, ttlMs = 60_000) {
    this.maxSize = maxSize;
    this.ttlMs   = ttlMs;
    this.store   = new Map(); // key -> { value, expiresAt }
  }

  set(key, value, ttlMs = this.ttlMs) {
    if (this.store.size >= this.maxSize) {
      // Evict oldest entry
      const firstKey = this.store.keys().next().value;
      this.store.delete(firstKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    // Move to end (recency bump)
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  has(key) { return this.get(key) !== null; }

  delete(key) { this.store.delete(key); }

  clear() { this.store.clear(); }

  get size() { return this.store.size; }

  stats() {
    let expired = 0;
    const now = Date.now();
    for (const [, entry] of this.store) {
      if (now > entry.expiresAt) expired++;
    }
    return { size: this.store.size, maxSize: this.maxSize, expired };
  }
}

// Shared singleton caches
export const proofCache     = new Cache(1000, 120_000); // 2min TTL for proof lookups
export const statsCache     = new Cache(10,   30_000);  // 30s TTL for stats
export const leaderboardCache = new Cache(5,  60_000);  // 1min TTL for leaderboard