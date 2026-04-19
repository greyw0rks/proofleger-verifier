/**
 * ProofLedger Indexer
 * Handles paginated syncing of contract transactions
 */
import { appendFileSync } from "fs";
const API = "https://api.hiro.so";
const PAGE_SIZE = 50;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { appendFileSync("./verifier.log", line + "\n"); } catch {}
}

export async function fetchPage(contractId, offset) {
  const url = `${API}/extended/v1/address/${contractId}/transactions?limit=${PAGE_SIZE}&offset=${offset}`;
  const res = await fetch(url);
  if (res.status === 429) {
    log("Rate limited — waiting 5s...");
    await new Promise(r => setTimeout(r, 5000));
    return fetchPage(contractId, offset);
  }
  if (!res.ok) throw new Error(`API ${res.status}: ${url}`);
  const data = await res.json();
  return { results: data.results || [], total: data.total || 0 };
}

export async function syncContractTxs(contractId, fromOffset, onTx) {
  let offset = fromOffset;
  let processed = 0;
  let hasMore = true;

  while (hasMore) {
    const { results, total } = await fetchPage(contractId, offset);
    if (results.length === 0) { hasMore = false; break; }
    for (const tx of results) await onTx(tx);
    processed += results.length;
    offset += results.length;
    if (results.length < PAGE_SIZE) hasMore = false;
    if (offset >= total) hasMore = false;
    if (results.length > 0) await new Promise(r => setTimeout(r, 300));
  }

  return { processed, newOffset: offset };
}