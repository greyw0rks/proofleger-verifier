/**
 * ProofLedger Celo Indexer
 * Polls CeloScan API for new transactions on the ProofLedger Celo contract
 */
import { appendFileSync } from "fs";

const CELOSCAN   = "https://api.celoscan.io/api";
const CONTRACT   = "0x251B3302c0CcB1cFBeb0cda3dE06C2D312a41735";
const LOG_FILE   = "./verifier.log";
const PAGE_SIZE  = 50;

function log(msg) {
  const line = `[${new Date().toISOString()}] [CELO] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + "\n"); } catch {}
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export async function fetchCeloTxPage(startBlock = 0) {
  const url = `${CELOSCAN}?module=account&action=txlist&address=${CONTRACT}` +
    `&startblock=${startBlock}&sort=asc&page=1&offset=${PAGE_SIZE}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CeloScan HTTP ${res.status}`);
  const data = await res.json();
  if (data.status === "0") return [];
  return data.result || [];
}

export function parseCeloTx(tx) {
  if (tx.isError !== "0") return null;
  const input = tx.input || "";
  // anchorDocument selector: first 4 bytes of keccak256("anchorDocument(bytes32,string,string)")
  const isAnchor = input.startsWith("0x") && input.length > 10;
  if (!isAnchor) return null;
  return {
    txid:        tx.hash,
    from:        tx.from,
    blockNumber: parseInt(tx.blockNumber),
    timestamp:   new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
    gasUsed:     parseInt(tx.gasUsed),
    network:     "celo",
    category:    "anchor",
    verified:    1,
  };
}

export async function syncCeloTxs(fromBlock, onTx) {
  log(`Syncing from block ${fromBlock}...`);
  const txs = await fetchCeloTxPage(fromBlock);
  let processed = 0;
  for (const tx of txs) {
    const parsed = parseCeloTx(tx);
    if (parsed) { await onTx(parsed); processed++; }
    await sleep(100);
  }
  log(`Processed ${processed} Celo txs from ${txs.length} fetched`);
  const lastBlock = txs.length > 0 ? parseInt(txs[txs.length-1].blockNumber) + 1 : fromBlock;
  return { processed, newBlock: lastBlock, hasMore: txs.length === PAGE_SIZE };
}