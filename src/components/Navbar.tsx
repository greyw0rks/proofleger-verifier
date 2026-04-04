"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Shield, Database, CheckCircle, ExternalLink, Wallet, X } from "lucide-react";
export default function Navbar() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  useEffect(() => {
    const stored = sessionStorage.getItem("pl_wallet");
    if (stored) setWalletAddress(stored);
  }, []);
  const connectWallet = async () => {
    setConnecting(true);
    try {
      const { showConnect } = await import("@stacks/connect");
      showConnect({
        appDetails: { name: "ProofLedger Verifier", icon: "/icon.svg" },
        onFinish: (payload: { userSession?: { loadUserData: () => { profile?: { stxAddress?: { mainnet?: string } } } } }) => {
          const addr = payload?.userSession?.loadUserData()?.profile?.stxAddress?.mainnet;
          if (addr) { setWalletAddress(addr); sessionStorage.setItem("pl_wallet", addr); }
        },
        onCancel: () => setConnecting(false),
      });
    } catch (e) { console.error(e); } finally { setConnecting(false); }
  };
  const disconnect = () => { setWalletAddress(null); sessionStorage.removeItem("pl_wallet"); };
  const truncate = (a: string) => `${a.slice(0, 7)}…${a.slice(-5)}`;
  const navLinkStyle = { display:"flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:6,fontSize:13,color:"var(--text-muted)",textDecoration:"none" } as const;
  return (
    <nav style={{ borderBottom:"1px solid var(--border)",background:"rgba(10,13,18,0.92)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:50 }}>
      <div style={{ maxWidth:1200,margin:"0 auto",padding:"0 24px" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",height:60 }}>
          <Link href="/" style={{ display:"flex",alignItems:"center",gap:10,textDecoration:"none" }}>
            <div style={{ width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#2a5cff,#00c896)",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <Shield size={16} color="white" />
            </div>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:600,color:"var(--text)",lineHeight:1.2 }}>ProofLedger</div>
              <div style={{ fontSize:10,color:"var(--text-muted)",letterSpacing:"0.1em",textTransform:"uppercase" }}>Verifier</div>
            </div>
          </Link>
          <div style={{ display:"flex",alignItems:"center",gap:4 }}>
            <Link href="/" style={navLinkStyle}><Database size={14} />Registry</Link>
            <Link href="/verify" style={navLinkStyle}><CheckCircle size={14} />Verify</Link>
            <a href="https://proofleger.vercel.app" target="_blank" rel="noopener noreferrer" style={{ ...navLinkStyle }}><ExternalLink size={14} />ProofLedger</a>
          </div>
          <div>
            {walletAddress ? (
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <div style={{ display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:20,border:"1px solid var(--green-dim)",background:"rgba(0,200,150,0.08)",fontSize:12,fontFamily:"'IBM Plex Mono',monospace",color:"var(--green)" }}>
                  <div style={{ width:6,height:6,borderRadius:"50%",background:"var(--green)" }} />{truncate(walletAddress)}
                </div>
                <button onClick={disconnect} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",padding:4 }}><X size={14} /></button>
              </div>
            ) : (
              <button onClick={connectWallet} disabled={connecting} style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:20,border:"1px solid var(--border-light)",background:"transparent",color:"var(--text)",fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif" }}>
                <Wallet size={14} />{connecting ? "Connecting…" : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
