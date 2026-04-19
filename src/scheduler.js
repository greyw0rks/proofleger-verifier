/**
 * ProofLedger Verifier Scheduler
 * Manages sync schedule and retry logic
 */
import { appendFileSync } from "fs";

function log(msg) {
  const line = `[${new Date().toISOString()}] [SCHEDULER] ${msg}`;
  console.log(line);
  try { appendFileSync("./verifier.log", line + "\n"); } catch {}
}

export class SyncScheduler {
  constructor(syncFn, options = {}) {
    this.syncFn = syncFn;
    this.intervalMs = options.intervalMs || 15 * 60 * 1000;
    this.maxRetries = options.maxRetries || 3;
    this.running = false;
    this.timer = null;
    this.runCount = 0;
    this.errorCount = 0;
  }

  async runOnce() {
    if (this.running) { log("Sync already running, skipping"); return; }
    this.running = true;
    const start = Date.now();
    try {
      await this.syncFn();
      this.runCount++;
      log(`Sync #${this.runCount} complete in ${((Date.now()-start)/1000).toFixed(1)}s`);
    } catch(e) {
      this.errorCount++;
      log(`Sync error (#${this.errorCount}): ${e.message}`);
    } finally {
      this.running = false;
    }
  }

  start() {
    log(`Scheduler started — interval: ${this.intervalMs/60000}m`);
    this.runOnce();
    this.timer = setInterval(() => this.runOnce(), this.intervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    log("Scheduler stopped");
  }

  status() {
    return { running: this.running, runCount: this.runCount, errorCount: this.errorCount, intervalMs: this.intervalMs };
  }
}