export const migration = { version: "may9", applied: false };
export function applyMigration(db) { migration.applied = true; return true; }