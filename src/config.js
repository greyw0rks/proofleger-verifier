/**
 * ProofLedger Verifier Configuration
 */

export const CONFIG = {
  // Network
  STACKS_API:      process.env.STACKS_API      || "https://api.hiro.so",
  CELO_RPC:        process.env.CELO_RPC        || "https://feth.celo.org",
  CELOSCAN_API:    process.env.CELOSCAN_API    || "https://api.celoscan.io/api",

  // Contract addresses
  STACKS_CONTRACT: process.env.STACKS_CONTRACT || "SP1SY1E599GN04XRD2DQBKV7E62HYBJR2CT9S5QKK",
  CELO_CONTRACT:   process.env.CELO_CONTRACT   || "0x251B3302c0CcB1cFBeb0cda3dE06C2D312a41735",

  // Database
  DB_PATH:         process.env.DB_PATH         || "./proofs.db",

  // Sync
  SYNC_INTERVAL_MS:process.env.SYNC_INTERVAL_MS
                     ? parseInt(process.env.SYNC_INTERVAL_MS)
                     : 15 * 60 * 1000,  // 15 min
  PAGE_SIZE:       parseInt(process.env.PAGE_SIZE || "50"),

  // API server
  API_PORT:        parseInt(process.env.PORT   || "3001"),
  API_ENABLED:     process.env.API_ENABLED !== "false",

  // Alerts
  HIGH_VOLUME_THRESHOLD: parseInt(process.env.HIGH_VOLUME_THRESHOLD || "100"),
  STALE_SYNC_MINUTES:    parseInt(process.env.STALE_SYNC_MINUTES    || "30"),
};

export function printConfig() {
  console.log("ProofLedger Verifier Config:");
  Object.entries(CONFIG).forEach(([k,v]) => {
    const display = k.toLowerCase().includes("key") ? "***" : v;
    console.log(`  ${k.padEnd(22)} ${display}`);
  });
}