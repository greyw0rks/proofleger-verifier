const store = new Map();
export function set(key, value, ttl = 60000) {
  store.set(key, { value, expires: Date.now() + ttl });
}
export function get(key) {
  const item = store.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) { store.delete(key); return null; }
  return item.value;
}
export function clear() { store.clear(); }
export function getStatus() { return { ok: true, size: store.size }; }