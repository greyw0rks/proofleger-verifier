/**
 * ProofLedger Verifier Webhook Dispatcher
 * POST to registered endpoints when new proofs or attestations are indexed
 */
import { appendFileSync } from "fs";

const WEBHOOK_LOG = "./webhooks.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [WEBHOOK] ${msg}`;
  console.log(line);
  try { appendFileSync(WEBHOOK_LOG, line + "\n"); } catch {}
}

export class WebhookDispatcher {
  constructor(db) {
    this.db = db;
    this._ensureTable();
  }

  _ensureTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS webhooks (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        url      TEXT NOT NULL UNIQUE,
        events   TEXT NOT NULL DEFAULT "proof,attest",
        secret   TEXT,
        active   INTEGER NOT NULL DEFAULT 1,
        failures INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime("now"))
      )
    `);
  }

  register(url, events = ["proof", "attest"], secret = null) {
    this.db.prepare(`
      INSERT OR REPLACE INTO webhooks (url, events, secret, active, failures)
      VALUES (?, ?, ?, 1, 0)
    `).run(url, events.join(","), secret);
    log(`Registered webhook: ${url} for [${events.join(", ")}]`);
  }

  unregister(url) {
    this.db.prepare("UPDATE webhooks SET active = 0 WHERE url = ?").run(url);
    log(`Unregistered webhook: ${url}`);
  }

  async dispatch(eventType, payload) {
    const hooks = this.db.prepare(`
      SELECT * FROM webhooks
      WHERE active = 1 AND events LIKE ? AND failures < 5
    `).all(`%${eventType}%`);

    if (!hooks.length) return { sent: 0, failed: 0 };

    let sent = 0, failed = 0;

    await Promise.allSettled(hooks.map(async hook => {
      try {
        const body = JSON.stringify({
          event:   eventType,
          payload,
          timestamp: new Date().toISOString(),
        });

        const headers = { "Content-Type": "application/json" };
        if (hook.secret) {
          headers["X-ProofLedger-Signature"] = hook.secret;
        }

        const res = await fetch(hook.url, { method: "POST", headers, body });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        this.db.prepare("UPDATE webhooks SET failures = 0 WHERE url = ?").run(hook.url);
        sent++;
        log(`Dispatched ${eventType} to ${hook.url}`);
      } catch(e) {
        this.db.prepare("UPDATE webhooks SET failures = failures + 1 WHERE url = ?").run(hook.url);
        failed++;
        log(`Failed dispatch to ${hook.url}: ${e.message}`);
      }
    }));

    return { sent, failed };
  }

  list() {
    return this.db.prepare("SELECT url, events, active, failures, created_at FROM webhooks").all();
  }
}