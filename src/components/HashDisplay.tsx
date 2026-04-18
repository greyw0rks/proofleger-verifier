"use client";
import { useState } from "react";

interface Props {
  hash: string;
  short?: boolean;
  label?: string;
}

export default function HashDisplay({ hash, short = false, label }: Props) {
  const [copied, setCopied] = useState(false);
  const clean = hash.startsWith("0x") ? hash.slice(2) : hash;
  const display = short ? `${clean.slice(0, 10)}…${clean.slice(-6)}` : clean;

  const copy = async () => {
    await navigator.clipboard.writeText(clean);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <code style={{
          fontFamily: "IBM Plex Mono, monospace", fontSize: 12,
          color: "var(--accent)", wordBreak: "break-all",
          padding: "6px 10px", borderRadius: 6,
          background: "rgba(42,92,255,0.08)",
          border: "1px solid rgba(42,92,255,0.15)",
          flex: 1,
        }}>
          {display}
        </code>
        <button onClick={copy} style={{
          background: "none", border: "1px solid var(--border-light)",
          borderRadius: 6, padding: "5px 10px", cursor: "pointer",
          fontSize: 11, color: copied ? "var(--green)" : "var(--text-muted)",
          fontFamily: "DM Sans, sans-serif", transition: "all 0.15s",
          whiteSpace: "nowrap",
        }}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}