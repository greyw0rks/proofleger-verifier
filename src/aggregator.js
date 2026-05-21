export function aggregate(datasets) {
  return datasets.flat().sort((a, b) => (b.block_height ?? 0) - (a.block_height ?? 0));
}
export function getStatus() { return { ok: true, module: "aggregator" }; }