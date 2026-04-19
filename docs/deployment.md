# ProofLedger Verifier Deployment

## Server Setup (AWS Ubuntu)

```bash
cd ~/proofleger-verifier
npm install
```

## Start with PM2

```bash
npm install -g pm2
pm2 start src/index.js --name proofleger-verifier
pm2 save
pm2 startup  # auto-start on reboot
```

## Or with tmux

```bash
tmux new-session -d -s proofleger-verifier \
  "cd ~/proofleger-verifier && node src/index.js"
tmux attach -t proofleger-verifier
```

## Monitor

```bash
pm2 logs proofleger-verifier
pm2 status
tail -f ~/proofleger-verifier/verifier.log
```

## Query the Database

```bash
node src/query.js stats
node src/query.js recent 20
node src/query.js search "diploma"
node src/query.js top 10
node src/query.js export json
```

## API Access

```bash
curl http://localhost:3001/stats
curl "http://localhost:3001/proof?hash=a1b2c3"
curl "http://localhost:3001/wallet?address=SP1SY1..."
```