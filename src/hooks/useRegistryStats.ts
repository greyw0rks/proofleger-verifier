"use client";
import { useState, useEffect } from "react";
import { getTotalVerifications, getTotalFees } from "@/lib/verify-client";

export function useRegistryStats() {
  const [totalVerifications, setTotalVerifications] = useState<number>(0);
  const [totalFees, setTotalFees] = useState<number>(0);
  const [blockHeight, setBlockHeight] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [v, f, b] = await Promise.allSettled([
          getTotalVerifications(),
          getTotalFees(),
          fetch("https://api.mainnet.hiro.so/v2/info").then(r => r.json()).then(d => d.stacks_tip_height),
        ]);
        if (v.status === "fulfilled") setTotalVerifications(v.value);
        if (f.status === "fulfilled") setTotalFees(f.value);
        if (b.status === "fulfilled") setBlockHeight(b.value);
      } finally { setLoading(false); }
    }
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  return { totalVerifications, totalFees, blockHeight, loading };
}