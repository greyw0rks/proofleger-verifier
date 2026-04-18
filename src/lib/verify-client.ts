import { CONTRACT_ADDRESS, VERIFIER_CONTRACT, MAIN_CONTRACT } from "./stacks";

const API = "https://api.mainnet.hiro.so";

export async function getVerificationRecord(hash: string) {
  const clean = hash.startsWith("0x") ? hash.slice(2) : hash;
  const padded = clean.padStart(64, "0");
  const res = await fetch(
    `${API}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${VERIFIER_CONTRACT}/get-verification`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: CONTRACT_ADDRESS, arguments: ["0x" + padded] }),
    }
  );
  const data = await res.json();
  return data?.result?.startsWith("(some") ? data.result : null;
}

export async function getTotalVerifications(): Promise<number> {
  const res = await fetch(
    `${API}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${VERIFIER_CONTRACT}/get-total-verifications`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: CONTRACT_ADDRESS, arguments: [] }),
    }
  );
  const data = await res.json();
  if (!data?.result) return 0;
  return parseInt(data.result.replace("(ok u", "").replace(")", ""), 10) || 0;
}

export async function getTotalFees(): Promise<number> {
  const res = await fetch(
    `${API}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${VERIFIER_CONTRACT}/get-total-fees`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: CONTRACT_ADDRESS, arguments: [] }),
    }
  );
  const data = await res.json();
  if (!data?.result) return 0;
  return parseInt(data.result.replace("(ok u", "").replace(")", ""), 10) || 0;
}

export async function getProofEvents(limit = 50, offset = 0) {
  const res = await fetch(
    `${API}/extended/v1/contract/${CONTRACT_ADDRESS}.${MAIN_CONTRACT}/events?limit=${limit}&offset=${offset}`,
    { next: { revalidate: 30 } }
  );
  return res.ok ? res.json() : { results: [], total: 0 };
}