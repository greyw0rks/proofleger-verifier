export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "SP1SY1E599GN04XRD2DQBKV7E62HYBJR2CT9S5QKK";
export const VERIFIER_CONTRACT = process.env.NEXT_PUBLIC_VERIFIER_CONTRACT || "proofleger-verifier";
export const MAIN_CONTRACT = process.env.NEXT_PUBLIC_MAIN_CONTRACT || "proofleger";
export const VERIFY_FEE_USTX = 1000;

export function hexToUint8Array(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const padded = clean.padStart(64, "0");
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(padded.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
export function formatSTX(ustx: number): string {
  const stx = ustx / 1_000_000;
  return stx < 0.001 ? `${ustx} μSTX` : `${stx.toFixed(4)} STX`;
}
export function truncatePrincipal(p: string): string {
  return !p || p.length <= 16 ? p : `${p.slice(0, 8)}…${p.slice(-5)}`;
}
export function truncateHash(h: string): string {
  return !h || h.length <= 16 ? h : `${h.slice(0, 10)}…${h.slice(-6)}`;
}
export async function fetchContractEvents(limit = 50, offset = 0) {
  const url = `https://api.mainnet.hiro.so/extended/v1/contract/${CONTRACT_ADDRESS}.${MAIN_CONTRACT}/events?limit=${limit}&offset=${offset}`;
  try {
    const res = await fetch(url, { next: { revalidate: 30 } });
    return res.ok ? await res.json() : { results: [], total: 0 };
  } catch { return { results: [], total: 0 }; }
}
