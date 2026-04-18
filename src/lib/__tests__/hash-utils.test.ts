import { isValidHash, formatHash } from "../hash-utils";

describe("isValidHash", () => {
  it("accepts valid 64-char hex", () => {
    expect(isValidHash("a".repeat(64))).toBe(true);
  });
  it("accepts 0x-prefixed hash", () => {
    expect(isValidHash("0x" + "b".repeat(64))).toBe(true);
  });
  it("rejects short strings", () => {
    expect(isValidHash("abc123")).toBe(false);
  });
  it("rejects non-hex chars", () => {
    expect(isValidHash("g".repeat(64))).toBe(false);
  });
});

describe("formatHash", () => {
  const hash = "a".repeat(64);
  it("returns full hash by default", () => {
    expect(formatHash(hash)).toBe(hash);
  });
  it("returns short form when requested", () => {
    expect(formatHash(hash, true)).toMatch(/^aaaaaaaa…aaaaaa$/);
  });
});