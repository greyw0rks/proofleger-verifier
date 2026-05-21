export const alerts = [];
export function addAlert(config) { alerts.push({ ...config, created: Date.now() }); }
export function checkAlerts(metric, value) {
  return alerts.filter(a => a.metric === metric && value >= a.threshold);
}
export function getStatus() { return { ok: true, alerts: alerts.length }; }