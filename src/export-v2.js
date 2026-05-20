import db from "./database.js";
import { writeFileSync } from "fs";
const TABLES = ["proof_stamps","proof_certifications","marketplace_listings","marketplace_purchases","referrals","staking_v2","governance_v2_proposals","governance_v2_votes","vote_delegations","oracle_prices"];
export function exportV2(outputPath) {
  const snapshot = { exported_at: new Date().toISOString(), tables: {} };
  for (const t of TABLES) {
    try { snapshot.tables[t] = db.prepare(`SELECT * FROM ${t}`).all(); }
    catch (_) { snapshot.tables[t] = []; }
  }
  const out = outputPath ?? `./snapshots/v2-${Date.now()}.json`;
  writeFileSync(out, JSON.stringify(snapshot, null, 2));
  const total = Object.values(snapshot.tables).reduce((s,rows) => s + rows.length, 0);
  console.log(`[export-v2] ${total} rows written to ${out}`);
  return out;
}