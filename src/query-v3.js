export function query(db, sql, params = []) {
  try { return db.prepare(sql).all(...params); }
  catch (e) { console.error("[query-v3]", e.message); return []; }
}