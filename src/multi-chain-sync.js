/**
 * ProofLedger Multi-Chain Sync
 * Orchestrates indexing across Stacks (Hiro API) and Celo (CeloScan)
 */
import { syncContractTxs } from "./indexer.js";
import { syncCeloTxs } from "./celo-indexer.js";
import { parseTx, isProofLedgerTx, getTxCategory } from "./parser.js";
import { insertProof, getSyncState, setSyncState, markVerified } from "./database.js";
import { insertCeloProof, getCeloSyncState, setCeloSyncState } from "./celo-database.js";
import { appendFileSync } from "fs";

const STACKS_CONTRACT = "SP1SY1E599GN04XRD2DQBKV7E62HYBJR2CT9S5QKK.proofleger3";
const LOG_FILE = "./verifier.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [SYNC] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + "\n"); } catch {}
}

export async function syncAll(db) {
  const [stacksResult, celoResult] = await Promise.allSettled([
    syncStacks(db),
    syncCelo(db),
  ]);

  const stacks = stacksResult.status === "fulfilled" ? stacksResult.value : { processed: 0, error: stacksResult.reason?.message };
  const celo   = celoResult.status   === "fulfilled" ? celoResult.value   : { processed: 0, error: celoResult.reason?.message };

  log(`Sync complete — Stacks: ${stacks.processed} | Celo: ${celo.processed}`);
  return { stacks, celo };
}

async function syncStacks(db) {
  const state = getSyncState(db, STACKS_CONTRACT);
  const fromOffset = state?.last_offset || 0;

  const { processed, newOffset } = await syncContractTxs(
    STACKS_CONTRACT, fromOffset,
    async (tx) => {
      if (!isProofLedgerTx(tx)) return;
      const parsed = parseTx(tx, "proofleger3");
      if (!parsed) return;
      parsed.category = getTxCategory(parsed);
      insertProof(db, parsed);
    }
  );

  setSyncState(db, STACKS_CONTRACT, newOffset);
  log(`Stacks: ${processed} new txs, offset now ${newOffset}`);
  return { processed };
}

async function syncCelo(db) {
  const state = getCeloSyncState(db);
  const fromBlock = state?.last_block || 0;
  let totalProcessed = 0;
  let currentBlock = fromBlock;
  let hasMore = true;

  while (hasMore) {
    const { processed, newBlock, hasMore: more } = await syncCeloTxs(currentBlock,
      (proof) => insertCeloProof(db, proof)
    );
    totalProcessed += processed;
    currentBlock = newBlock;
    hasMore = more;
    if (hasMore) await new Promise(r => setTimeout(r, 2000));
  }

  setCeloSyncState(db, currentBlock);
  log(`Celo: ${totalProcessed} new txs, block now ${currentBlock}`);
  return { processed: totalProcessed };
}