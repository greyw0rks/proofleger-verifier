export interface ProofRecord {
  txId: string;
  blockHeight: number;
  hash: string;
  owner: string;
  name: string;
  timestamp?: string;
}

export function parseProofEvent(event: Record<string, unknown>): ProofRecord {
  const repr = (event.contract_log as Record<string, unknown>)?.value as Record<string, unknown>;
  const r = repr?.repr?.toString() || "";
  const hashMatch = r.match(/proof-hash\s+0x([a-f0-9]+)/i);
  const ownerMatch = r.match(/owner\s+(S[A-Z0-9]+)/);
  const nameMatch = r.match(/name\s+"([^"]+)"/);
  return {
    txId: event.tx_id as string,
    blockHeight: event.block_height as number,
    hash: hashMatch?.[1] || (event.tx_id as string)?.slice(2, 34) || "",
    owner: ownerMatch?.[1] || (event.sender as string) || "Unknown",
    name: nameMatch?.[1] || "Untitled Document",
  };
}

export function formatBlockHeight(height: number): string {
  return `#${height.toLocaleString()}`;
}

export function formatAddress(addr: string, len = 8): string {
  if (!addr || addr.length <= len * 2) return addr;
  return `${addr.slice(0, len)}…${addr.slice(-5)}`;
}

export function formatFee(microStx: number): string {
  const stx = microStx / 1_000_000;
  return stx < 0.001 ? `${microStx} μSTX` : `${stx.toFixed(4)} STX`;
}