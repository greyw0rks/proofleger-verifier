import { Suspense } from "react";
import Link from "next/link";
import { Search, Shield, Clock, Hash, ArrowUpRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import StatsBar from "@/components/StatsBar";
import { fetchContractEvents, truncatePrincipal, truncateHash, CONTRACT_ADDRESS, MAIN_CONTRACT } from "@/lib/stacks";

interface ProofEvent {
  tx_id: string; block_height: number;
  contract_log?: { value?: { repr?: string } };
  sender?: string;
}
function parseProof(e: ProofEvent) {
  const r = e.contract_log?.value?.repr || "";
  const hashMatch = r.match(/proof-hash\s+0x([a-f0-9]+)/i);
  const ownerMatch = r.match(/owner\s+(S[A-Z0-9]+)/);
  const nameMatch = r.match(/name\s+"([^"]+)"/);
  return {
    txId: e.tx_id, blockHeight: e.block_height,
    hash: hashMatch?.[1] || e.tx_id.slice(2, 34),
    owner: ownerMatch?.[1] || e.sender || "Unknown",
    name: nameMatch?.[1] || "Untitled Document",
  };
}

async function ProofTable() {
  const data = await fetchContractEvents(50, 0);
  const proofs = (data.results || []).map(parseProof)
    .filter((p: ReturnType<typeof parseProof>, i: number, arr: ReturnType<typeof parseProof>[]) => arr.findIndex((x: ReturnType<typeof parseProof>) => x.hash === p.hash) === i);
  if (!proofs.length) return (
    <div style={{ textAlign:"center",padding:"80px 24px",color:"var(--text-muted)" }}>
      <Shield size={40} style={{ margin:"0 auto 16px",opacity:0.3 }} />
      <p>No proofs indexed yet.</p>
      <a href="https://proofleger.vercel.app" target="_blank" rel="noopener noreferrer" style={{ display:"inline-block",marginTop:16,color:"var(--accent)",fontSize:13 }}>Register a proof →</a>
    </div>
  );
  return (
    <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
      <thead>
        <tr style={{ borderBottom:"2px solid var(--border-light)" }}>
          {["#","Document Hash","Owner","Block","Name","Status",""].map((h,i) => (
            <th key={i} style={{ padding:"10px 16px",textAlign:"left",color:"var(--text-muted)",fontWeight:500,fontSize:11,letterSpacing:"0.06em",textTransform:"uppercase",background:"var(--surface)" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {proofs.map((p: ReturnType<typeof parseProof>, i: number) => (
          <tr key={p.hash} className="proof-row">
            <td style={{ padding:"12px 16px",color:"var(--text-muted)",fontSize:12,fontFamily:"'IBM Plex Mono',monospace" }}>{String(i+1).padStart(3,"0")}</td>
            <td style={{ padding:"12px 16px" }}>
              <Link href={`/proof/${p.hash}`} style={{ textDecoration:"none" }}>
                <code style={{ fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"var(--accent)" }}>{truncateHash(p.hash)}</code>
              </Link>
            </td>
            <td style={{ padding:"12px 16px" }}><span style={{ fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--text-muted)" }}>{truncatePrincipal(p.owner)}</span></td>
            <td style={{ padding:"12px 16px" }}><span style={{ fontFamily:"'IBM Plex Mono',monospace",fontSize:12 }}>#{p.blockHeight.toLocaleString()}</span></td>
            <td style={{ padding:"12px 16px",maxWidth:180 }}><span style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block" }}>{p.name}</span></td>
            <td style={{ padding:"12px 16px" }}><span className="badge-unverified" style={{ padding:"3px 10px",borderRadius:12,fontSize:11,fontWeight:500 }}>Registered</span></td>
            <td style={{ padding:"12px 16px" }}><Link href={`/proof/${p.hash}`} style={{ display:"inline-flex",alignItems:"center",gap:4,color:"var(--text-muted)",textDecoration:"none",fontSize:12 }}>View <ArrowUpRight size={12}/></Link></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function HomePage() {
  return (
    <div style={{ minHeight:"100vh" }}>
      <Navbar /><StatsBar />
      <main style={{ maxWidth:1200,margin:"0 auto",padding:"40px 24px" }}>
        <div style={{ marginBottom:40 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
            <div style={{ padding:"3px 10px",borderRadius:4,background:"rgba(42,92,255,0.1)",border:"1px solid rgba(42,92,255,0.25)",fontSize:11,color:"#6b9cff",letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:500 }}>Public Registry</div>
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:600,color:"var(--text)",lineHeight:1.2,marginBottom:10 }}>Document Proof Registry</h1>
          <p style={{ color:"var(--text-muted)",fontSize:15,maxWidth:600,lineHeight:1.6 }}>Every document proof registered on Bitcoin via Stacks. Cryptographically immutable. Publicly verifiable.</p>
        </div>
        <div style={{ marginBottom:24,display:"flex",gap:12 }}>
          <div style={{ flex:1,position:"relative",border:"1px solid var(--border-light)",borderRadius:8,background:"var(--surface)",display:"flex",alignItems:"center" }}>
            <Search size={16} style={{ position:"absolute",left:14,color:"var(--text-muted)" }} />
            <input type="text" placeholder="Search by hash, address, or document name…" style={{ width:"100%",background:"none",border:"none",outline:"none",padding:"11px 14px 11px 40px",color:"var(--text)",fontSize:14,fontFamily:"'DM Sans',sans-serif" }} />
          </div>
          <Link href="/verify" style={{ display:"flex",alignItems:"center",gap:8,padding:"11px 20px",borderRadius:8,background:"linear-gradient(135deg,#2a5cff,#1a3dcc)",color:"white",textDecoration:"none",fontSize:14,fontWeight:500,whiteSpace:"nowrap",boxShadow:"0 0 20px rgba(42,92,255,0.25)" }}>
            <Shield size={15} />Verify Proof
          </Link>
        </div>
        <div style={{ border:"1px solid var(--border)",borderRadius:12,background:"var(--surface)",overflow:"hidden" }}>
          <div style={{ padding:"16px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <Hash size={14} style={{ color:"var(--text-muted)" }} />
              <span style={{ fontSize:13,fontWeight:500 }}>All Registered Proofs</span>
              <span style={{ fontSize:11,color:"var(--text-muted)",fontFamily:"'IBM Plex Mono',monospace" }}>— {CONTRACT_ADDRESS.slice(0,8)}…{MAIN_CONTRACT}</span>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--text-muted)" }}>
              <Clock size={12}/>Updates every 30s
            </div>
          </div>
          <Suspense fallback={<div style={{ padding:40,textAlign:"center",color:"var(--text-muted)",fontSize:13 }}>Loading registry…</div>}>
            <div style={{ overflowX:"auto" }}><ProofTable /></div>
          </Suspense>
        </div>
        <div style={{ marginTop:24,padding:"16px 20px",borderRadius:8,border:"1px solid var(--border)",background:"rgba(42,92,255,0.03)",display:"flex",alignItems:"flex-start",gap:12,fontSize:12,color:"var(--text-muted)",lineHeight:1.6 }}>
          <Shield size={14} style={{ marginTop:1,color:"#6b9cff",flexShrink:0 }} />
          <span>All proofs are anchored to Bitcoin through Stacks. Once registered, a proof hash cannot be altered. Verification costs <strong style={{ color:"var(--text)" }}>0.001 STX</strong> and creates a permanent on-chain receipt.</span>
        </div>
      </main>
    </div>
  );
}
