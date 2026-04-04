"use client";
import { useEffect, useState } from "react";
import { Shield, Activity, Zap, Database } from "lucide-react";
export default function StatsBar() {
  const [blockHeight, setBlockHeight] = useState<number>(0);
  useEffect(() => {
    fetch("https://api.mainnet.hiro.so/v2/info")
      .then(r => r.json()).then(d => setBlockHeight(d.stacks_tip_height || 0)).catch(() => {});
  }, []);
  const items = [
    { icon: <Database size={13} />, label: "Network", value: "Stacks Mainnet" },
    { icon: <Shield size={13} />, label: "Anchored To", value: "Bitcoin" },
    { icon: <Zap size={13} />, label: "Verify Fee", value: "0.001 STX" },
    { icon: <Activity size={13} />, label: "Block Height", value: blockHeight ? `#${blockHeight.toLocaleString()}` : "—" },
  ];
  return (
    <div style={{ borderBottom:"1px solid var(--border)",background:"var(--surface)" }}>
      <div style={{ maxWidth:1200,margin:"0 auto",padding:"0 24px" }}>
        <div style={{ display:"flex",alignItems:"center" }}>
          {items.map((item, i) => (
            <div key={i} style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 20px",borderRight:i<items.length-1?"1px solid var(--border)":"none",fontSize:12 }}>
              <span style={{ color:"var(--text-muted)" }}>{item.icon}</span>
              <span style={{ color:"var(--text-muted)" }}>{item.label}:</span>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace",color:"var(--text)",fontWeight:500 }}>{item.value}</span>
            </div>
          ))}
          <div style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:6,padding:"8px 20px",fontSize:11 }}>
            <div style={{ width:6,height:6,borderRadius:"50%",background:"var(--green)" }} />
            <span style={{ color:"var(--text-muted)" }}>Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}
