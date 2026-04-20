/**
 * ProofLedger Verifier Wallet Report
 * Generate detailed reports for a single wallet across both chains
 */
import { writeFileSync } from "fs";

export function generateWalletReport(db, address) {
  const stacksProofs = db.prepare(
    "SELECT * FROM proofs WHERE sender = ? ORDER BY block_height ASC"
  ).all(address);

  let celoProofs = [];
  try {
    celoProofs = db.prepare(
      "SELECT * FROM celo_proofs WHERE from_address = ? ORDER BY block_number ASC"
    ).all(address);
  } catch {}

  const anchors   = stacksProofs.filter(p => p.category === "anchor");
  const attests   = stacksProofs.filter(p => p.category === "attest");
  const mints     = stacksProofs.filter(p => p.category === "mint");
  const verified  = stacksProofs.filter(p => p.verified === 1);

  const firstTx   = stacksProofs[0]?.block_height || null;
  const lastTx    = stacksProofs[stacksProofs.length-1]?.block_height || null;
  const docTypes  = [...new Set(stacksProofs.map(p => p.doc_type).filter(Boolean))];

  return {
    address,
    generatedAt: new Date().toISOString(),
    stacks: {
      totalTxs:   stacksProofs.length,
      anchors:    anchors.length,
      attests:    attests.length,
      mints:      mints.length,
      verified:   verified.length,
      firstBlock: firstTx,
      lastBlock:  lastTx,
      docTypes,
      recentProofs: anchors.slice(-5).map(p => ({
        hash: p.hash, title: p.title, type: p.doc_type, block: p.block_height
      })),
    },
    celo: {
      totalTxs:   celoProofs.length,
      firstBlock: celoProofs[0]?.block_number || null,
      lastBlock:  celoProofs[celoProofs.length-1]?.block_number || null,
    },
    score: anchors.length * 10 + attests.length * 5 + mints.length * 25,
  };
}

export function saveWalletReport(db, address, outputPath) {
  const report = generateWalletReport(db, address);
  const path = outputPath || `./wallet-${address.slice(0,10)}.json`;
  writeFileSync(path, JSON.stringify(report, null, 2));
  console.log(`Wallet report saved: ${path}`);
  return report;
}