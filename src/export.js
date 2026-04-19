/**
 * ProofLedger Verifier Export
 * Export proof database to CSV or JSON formats
 */
import { writeFileSync } from "fs";

export function exportJSON(db, outputPath = "./export.json") {
  const proofs = db.prepare("SELECT * FROM proofs WHERE verified = 1 ORDER BY block_height ASC").all();
  const stats = db.prepare("SELECT * FROM stats WHERE id = 1").get();
  const data = {
    exported_at: new Date().toISOString(),
    stats,
    proofs,
  };
  writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`Exported ${proofs.length} proofs to ${outputPath}`);
  return proofs.length;
}

export function exportCSV(db, outputPath = "./export.csv") {
  const proofs = db.prepare("SELECT * FROM proofs WHERE verified = 1 ORDER BY block_height ASC").all();
  if (proofs.length === 0) { console.log("No verified proofs to export"); return 0; }
  const header = Object.keys(proofs[0]).join(",");
  const rows = proofs.map(p => Object.values(p).map(v => `"${String(v ?? "").replace(/"/g, )}"`).join(","));
  writeFileSync(outputPath, [header, ...rows].join("\n"));
  console.log(`Exported ${proofs.length} proofs to ${outputPath}`);
  return proofs.length;
}

export function exportWalletReport(db, address, outputPath) {
  const proofs = db.prepare("SELECT * FROM proofs WHERE sender = ? ORDER BY block_height ASC").all(address);
  const path = outputPath || `./wallet-${address.slice(0,8)}.json`;
  writeFileSync(path, JSON.stringify({ address, proofs, total: proofs.length }, null, 2));
  console.log(`Wallet report: ${proofs.length} proofs → ${path}`);
  return proofs.length;
}