import { formatAddress, formatBlockHeight, formatFee } from "../proof-formatter";

describe("formatAddress", () => {
  it("truncates long addresses", () => {
    const addr = "SP1SY1E599GN04XRD2DQBKV7E62HYBJR2CT9S5QKK";
    expect(formatAddress(addr)).toMatch(/…/);
  });
  it("returns short addresses unchanged", () => {
    expect(formatAddress("SP123")).toBe("SP123");
  });
});

describe("formatBlockHeight", () => {
  it("formats with hash prefix", () => {
    expect(formatBlockHeight(150000)).toBe("#150,000");
  });
});

describe("formatFee", () => {
  it("formats micro-STX below threshold", () => {
    expect(formatFee(500)).toBe("500 μSTX");
  });
  it("formats STX above threshold", () => {
    expect(formatFee(1000)).toBe("0.0010 STX");
  });
});