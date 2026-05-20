import db from "./database.js";
export function searchV2(query, { limit=20, offset=0 }={}) {
  const q = `%${query}%`;
  const results = [];
  try {
    const stamps = db.prepare("SELECT *, \"stamp\" as type FROM proof_stamps WHERE note LIKE ? OR stamper LIKE ? OR level LIKE ? LIMIT ? OFFSET ?").all(q,q,q,limit,offset);
    results.push(...stamps);
  } catch (_) {}
  try {
    const certs = db.prepare("SELECT *, \"certification\" as type FROM proof_certifications WHERE tier LIKE ? OR issuer LIKE ? LIMIT ? OFFSET ?").all(q,q,limit,offset);
    results.push(...certs);
  } catch (_) {}
  try {
    const listings = db.prepare("SELECT *, \"listing\" as type FROM marketplace_listings WHERE schema LIKE ? OR seller LIKE ? LIMIT ? OFFSET ?").all(q,q,limit,offset);
    results.push(...listings);
  } catch (_) {}
  return results.slice(0, limit);
}