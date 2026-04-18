export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isValidHash(hash: string): boolean {
  const clean = hash.startsWith("0x") ? hash.slice(2) : hash;
  return /^[a-f0-9]{64}$/i.test(clean);
}

export function formatHash(hash: string, short = false): string {
  const clean = hash.startsWith("0x") ? hash.slice(2) : hash;
  if (short) return `${clean.slice(0, 8)}…${clean.slice(-6)}`;
  return clean;
}

export function hexToUint8Array(hex: string): Uint8Array {
  const clean = (hex.startsWith("0x") ? hex.slice(2) : hex).padStart(64, "0");
  return new Uint8Array(32).map((_, i) => parseInt(clean.slice(i * 2, i * 2 + 2), 16));
}