# ProofLedger Verifier — Deployment Guide

## Prerequisites

- Ubuntu 24 on AWS EC2 (t3.small or larger)
- Node.js 20+ and npm
- tmux for persistent sessions

## Initial Setup

```bash
git clone https://github.com/greyw0rks/proofleger-verifier.git
cd proofleger-verifier
npm install
```

## Environment

Create `.env` in the project root:

```
STACKS_CONTRACT=SP1SY1E599GN04XRD2DQBKV7E62HYBJR2CT9S5QKK
STACKS_API=https://api.hiro.so
CELO_RPC=https://feth.celo.org
PORT=3001
```

## Start the Verifier

```bash
tmux new-session -s verifier
node src/indexer.js
# Ctrl+B D to detach
```

## API Server

```bash
tmux new-session -s api
node src/api-v2.js
```

## Scheduled Jobs

The scheduler (`src/scheduler.js`) runs:
- Stacks indexer sync: every 10 minutes
- Celo indexer sync: every 2 minutes
- Stats aggregation: every hour
- Batch verification: 2pm, 5pm, 9pm daily

## Useful Commands

```bash
# Live stats
node src/query.js stats

# Leaderboard
node src/query.js leaderboard 10

# Timeline (last 14 days)
node src/query.js timeline 14

# Anomaly scan
node src/query.js anomalies

# Rate limiter stats
node -e "import(\"./src/rate-limiter.js\").then(m => console.log(m.rateLimiter.stats()))"
```

## Log Files

| File | Contents |
|---|---|
| `verifier.log` | Indexer and verification events |
| `anomalies.log` | Flagged unusual activity |
| `webhooks.log` | Webhook dispatch results |
| `aggregator.log` | Hourly stats aggregation |