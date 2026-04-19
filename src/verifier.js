/**
 * ProofLedger On-Chain Verifier
 * Verifies document hashes against the deployed contract
 */
const API = "https://api.hiro.so";
const CONTRACT = "SP1SY1E599GN04XRD2DQBKV7E62HYBJR2CT9S5QKK";
const VERIFY_DELAY_MS = 2000;

export async function verifyHash(hashHex) {
  const clean = hashHex.replace("0x", "");
  try {
    await new Promise(r => setTimeout(r, VERIFY_DELAY_MS));
    const res = await fetch(`${API}/v2/contracts/call-read/${CONTRACT}/proofleger3/get-doc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: CONTRACT, arguments: ["0x0200000020" + clean] }),
    });
    if (res.status === 429) {
      await new Promise(r => setTimeout(r, 10000));
      return null; // Skip this one, retry next cycle
    }
    if (!res.ok) return false;
    const data = await res.json();
    return data.okay && data.result && data.result !== "0x09";
  } catch { return false; }
}

export async function verifyBatch(hashes, onResult) {
  let verified = 0;
  for (const hash of hashes) {
    if (!hash) continue;
    const result = await verifyHash(hash);
    if (result === null) continue; // Rate limited, skip
    if (result) verified++;
    onResult(hash, result);
  }
  return verified;
}