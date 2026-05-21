export async function dispatch(url, payload) {
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return r.ok;
  } catch (e) { console.error("[webhook-v2]", e.message); return false; }
}