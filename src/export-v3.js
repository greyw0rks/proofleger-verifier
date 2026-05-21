import { writeFileSync } from "fs";
export function exportV3(db, path) {
  const data = { version: 3, exported_at: new Date().toISOString(), tables: {} };
  writeFileSync(path ?? "./snapshots/v3.json", JSON.stringify(data, null, 2));
  return path;
}