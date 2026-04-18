"use client";

type Status = "verified" | "unverified" | "pending" | "loading";

interface Props { status: Status; size?: "sm" | "md" | "lg"; }

const CONFIG = {
  verified:   { label: "On-Chain Verified", color: "var(--green)",  bg: "rgba(0,200,150,0.1)",   border: "var(--green-dim)" },
  unverified: { label: "Not Verified",       color: "var(--gold)",   bg: "rgba(201,168,76,0.08)", border: "var(--gold-dim)"  },
  pending:    { label: "Pending",            color: "#6b9cff",       bg: "rgba(42,92,255,0.1)",   border: "rgba(42,92,255,0.3)" },
  loading:    { label: "Checking…",          color: "var(--text-muted)", bg: "transparent",      border: "var(--border)" },
};

const SIZE = { sm: 11, md: 13, lg: 15 };

export default function ProofStatusBadge({ status, size = "md" }: Props) {
  const c = CONFIG[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: size === "lg" ? "6px 14px" : "3px 10px",
      borderRadius: 20, fontSize: SIZE[size], fontWeight: 500,
      color: c.color, background: c.bg, border: `1px solid ${c.border}`,
      fontFamily: "DM Sans, sans-serif",
    }}>
      {status !== "loading" && (
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
      )}
      {c.label}
    </span>
  );
}