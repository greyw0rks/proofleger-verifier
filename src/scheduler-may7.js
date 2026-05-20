import { syncGovernanceV2 } from "./governance-v2-indexer.js";
import { syncMarketplace } from "./marketplace-indexer.js";
import { syncReferrals } from "./referral-indexer.js";
import { syncStamps } from "./stamp-indexer.js";
import { syncCertifications } from "./certification-indexer.js";
import { syncOracle } from "./oracle-indexer.js";
import { syncStakingV2 } from "./staking-v2-indexer.js";
import { syncDelegationV2 } from "./delegation-v2-indexer.js";
import { syncTransfers } from "./transfer-indexer.js";
import { syncRewards } from "./reward-indexer.js";
export const may7Jobs = [
  { name:"governance-v2", fn:syncGovernanceV2, interval:60_000 },
  { name:"marketplace",   fn:syncMarketplace,  interval:45_000 },
  { name:"referrals",     fn:syncReferrals,    interval:90_000 },
  { name:"stamps",        fn:syncStamps,       interval:120_000 },
  { name:"certifications",fn:syncCertifications,interval:90_000 },
  { name:"oracle",        fn:syncOracle,       interval:30_000 },
  { name:"staking-v2",    fn:syncStakingV2,    interval:60_000 },
  { name:"delegation-v2", fn:syncDelegationV2, interval:120_000 },
  { name:"transfers",     fn:syncTransfers,    interval:60_000 },
  { name:"rewards",       fn:syncRewards,      interval:120_000 },
];
export function registerMay7Jobs(scheduler) {
  for (const job of may7Jobs) {
    scheduler.register(job.name, job.fn, job.interval);
    console.log(`[scheduler] registered ${job.name} (every ${job.interval/1000}s)`);
  }
}