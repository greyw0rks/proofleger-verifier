/**
 * ProofLedger Transaction Parser
 * Extracts structured data from raw Stacks transaction objects
 */

const TRACKED_FUNCTIONS = ["store", "attest", "mint", "anchor"];

export function isProofLedgerTx(tx) {
  if (tx.tx_status !== "success") return false;
  if (tx.tx_type !== "contract_call") return false;
  const fn = tx.contract_call?.function_name || "";
  return TRACKED_FUNCTIONS.some(t => fn.toLowerCase().includes(t));
}

export function parseTx(tx, contractName) {
  if (!isProofLedgerTx(tx)) return null;
  const fn = tx.contract_call?.function_name || "";
  const args = tx.contract_call?.function_args || [];

  let hash = null, title = null, docType = null;
  if (args[0]?.repr) hash = args[0].repr.replace("0x", "").replace(/[^0-9a-fA-F]/g,"");
  if (args[1]?.repr) title = args[1].repr.replace(/^"|"$/g, "");
  if (args[2]?.repr) docType = args[2].repr.replace(/^"|"$/g, "");

  return {
    txid: tx.tx_id,
    contract: contractName,
    function: fn,
    sender: tx.sender_address,
    hash: hash?.length === 64 ? hash : null,
    title,
    docType,
    blockHeight: tx.block_height,
    timestamp: tx.burn_block_time_iso || null,
    fee: parseInt(tx.fee_rate || 0),
    isAnchor: fn.includes("store") || fn.includes("anchor"),
    isAttest: fn.includes("attest"),
    isMint: fn.includes("mint"),
  };
}

export function getTxCategory(parsed) {
  if (parsed.isAnchor) return "anchor";
  if (parsed.isAttest) return "attest";
  if (parsed.isMint) return "mint";
  return "other";
}