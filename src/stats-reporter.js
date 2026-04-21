/**
 * ProofLedger Verifier Stats Reporter
 * Writes a human-readable stats summary to disk on each sync cycle
 */
import { writeFileSync } from "fs";

export function generateStatsReport(db) {
  const stacks = db.prepare("SELECT * FROM stats WHERE id = 1").get();
  const total  = db.prepare("SELECT COUNT(*) as c FROM proofs").get().c;
  const recent = db.prepare("SELECT * FROM proofs ORDER BY block_height DESC LIMIT 5").all();

  let celoTotal = 0, celoWallets = 0;
  try {
    celoTotal   = db.prepare("SELECT COUNT(*) as c FROM celo_proofs").get().c;
    celoWallets = db.prepare("SELECT COUNT(DISTINCT from_address) as c FROM celo_proofs").get().c;
  } catch {}

  const lines = [
    "# ProofLedger Verifier — Stats Report",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Stacks",
    `- Total records:      ${total}`,
    `- Anchors:            ${stacks?.total_anchors || 0}`,
    `- Attestations:       ${stacks?.total_attests || 0}`,
    `- Mints:              ${stacks?.total_mints || 0}`,
    `- Verified on-chain:  ${stacks?.total_verified || 0}`,
    `- Unique wallets:     ${stacks?.total_senders || 0}`,
    "",
    "## Celo",
    `- Total records:      ${celoTotal}`,
    `- Unique wallets:     ${celoWallets}`,
    "",
    "## Combined",
    `- Total txs:          ${total + celoTotal}`,
    `- Networks:           2 (Stacks + Celo)`,
    "",
    "## Recent Stacks Proofs",
    ...recent.map(p => `- [${p.category}] ${p.sender?.slice(0,10)}... "${p.title||"—"}" block:${p.block_height}`),
  ];

  const report = lines.join("\n");
  writeFileSync("./stats-report.md", report);
  return report;
}

export function logDailySummary(db) {
  const today = new Date().toISOString().slice(0, 10);
  const todayTxs = db.prepare(
    "SELECT COUNT(*) as c FROM proofs WHERE created_at >= ?"
  ).get(`${today}T00:00:00`).c;
  let celoToday = 0;
  try {
    celoToday = db.prepare(
      "SELECT COUNT(*) as c FROM celo_proofs WHERE created_at >= ?"
    ).get(`${today}T00:00:00`).c;
  } catch {}
  return { date: today, stacksNew: todayTxs, celoNew: celoToday, total: todayTxs + celoToday };
}