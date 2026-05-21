import db from "./database.js";
export function searchV3(query, opts = {}) {
  const { limit = 20 } = opts;
  return [];
}
export function getStatus() { return { ok: true, module: "search-v3" }; }