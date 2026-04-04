import Link from "next/link";
import { ArrowLeft, Shield, CheckCircle, AlertCircle, ExternalLink, Hash, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import VerifyButton from "@/components/VerifyButton";
import { CONTRACT_ADDRESS, MAIN_CONTRACT, VERIFIER_CONTRACT } from "@/lib/stacks";

interface Props { params: { hash: string } }

async function fetchVerification(hash: string) {
  try {
    const clean = (hash.startsWith("0x") ? hash.slice(2) : hash).padStart(64,"0");
    const res = await fetch(
      `https://api.mainnet.hiro.so/v2/contracts/call-read/${CONTRACT_ADDRESS}/${VERIFIER_CONTRACT}/get-verification`,
      { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ sender: CONTRACT_ADDRESS, arguments: ["0x"+clean] }),
        next: { revalidate: 30 }
      }
    );
    const data = await res.json();
    return data?.result?.startsWith("(some") ? data.result : null;
  } catch { return null; }
}

function Row({ label, value, mono, link }: { label:string; value:string; mono?:boolean; link?:string }) {
  return (
    <div style={{ display:"flex",alignItems:"flex-start",padding:"14px 0",borderBottom:"1px solid var(--border)",gap:24 }}>
      <span style={{ width:160,flexShrink:0,fontSize:12,color:"var(--text-muted)",fontWeight:500,paddingTop:1 }}>{label}</span>
      {link
        ? <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontFamily:mono?"'IBM Plex Mono',monospace":undefined,fontSize:mono?12:14,color:"var(--accent)",wordBreak:"break-all",display:"flex",alignItems:"center",gap:6,textDecoration:"none" }}>{value} <ExternalLink size={12}/></a>
        : <span style={{ fontFamily:mono?"'IBM Plex Mono',monospace":undefined,fontSize:mono?12:14,color:"var(--text)",wordBreak:"break-all" }}>{value}</span>
      }
    </div>
  );
}

export default async function ProofPage({ params }: Props) {
  const { hash } = params;
  const verified = await fetchVerification(hash);
  const isVerified = !!verified;
  return (
    <div style={{ minHeight:"100vh" }}>
      <Navbar />
      <main style={{ maxWidth:900,margin:"0 auto",padding:"40px 24px" }}>
        <Link href="/" style={{ display:"inline-flex",alignItems:"center",gap:6,color:"var(--text-muted)",textDecoration:"none",fontSize:13,marginBottom:32 }}>
          <ArrowLeft size={14}/>Back to Registry
        </Link>
        <div style={{ padding:28,borderRadius:12,marginBottom:28,border:`1px solid ${isVerified?"var(--green-dim)":"var(--border-light)"}`,background:isVerified?"rgba(0,200,150,0.08)":"var(--surface)",display:"flex",alignItems:"center",gap:20 }}>
          <div style={{ width:56,height:56,borderRadius:12,flexShrink:0,background:isVerified?"rgba(0,200,150,0.12)":"rgba(42,92,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${isVerified?"var(--green-dim)":"rgba(42,92,255,0.2)"}` }}>
            {isVerified ? <CheckCircle size={24} color="var(--green)"/> : <AlertCircle size={24} color="#6b9cff"/>}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4,color:isVerified?"var(--green)":"#6b9cff" }}>
              {isVerified ? "On-Chain Verified" : "Registered — Awaiting Verification"}
            </div>
            <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:600,color:"var(--text)",lineHeight:1.3,marginBottom:4 }}>Document Proof</h1>
            <code style={{ fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"var(--text-muted)" }}>{hash.slice(0,16)}…{hash.slice(-8)}</code>
          </div>
          {!isVerified && <VerifyButton hash={hash}/>}
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20 }}>
          <div style={{ border:"1px solid var(--border)",borderRadius:12,background:"var(--surface)",padding:24 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:600,marginBottom:20 }}>Proof Details</h2>
            <Row label="SHA-256 Hash" value={hash} mono/>
            <Row label="Network" value="Stacks Mainnet (Bitcoin L2)"/>
            <Row label="Main Contract" value={`${CONTRACT_ADDRESS.slice(0,8)}…${MAIN_CONTRACT}`} mono link={`https://explorer.hiro.so/address/${CONTRACT_ADDRESS}.${MAIN_CONTRACT}?chain=mainnet`}/>
            <Row label="Verifier Contract" value={`${CONTRACT_ADDRESS.slice(0,8)}…${VERIFIER_CONTRACT}`} mono link={`https://explorer.hiro.so/address/${CONTRACT_ADDRESS}.${VERIFIER_CONTRACT}?chain=mainnet`}/>
          </div>
          <div style={{ border:"1px solid var(--border)",borderRadius:12,background:"var(--surface)",padding:24 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:600,marginBottom:20 }}>Verification Record</h2>
            {isVerified ? (
              <>
                <div style={{ padding:"12px 16px",borderRadius:8,marginBottom:16,border:"1px solid var(--green-dim)",background:"rgba(0,200,150,0.06)",display:"flex",alignItems:"center",gap:10 }}>
                  <CheckCircle size={16} color="var(--green)"/>
                  <span style={{ fontSize:13,color:"var(--green)",fontWeight:500 }}>Cryptographic verification on record</span>
                </div>
                <Row label="Fee Paid" value="0.001 STX" mono/>
                <Row label="Status" value="Verified On-Chain"/>
              </>
            ) : (
              <>
                <div style={{ padding:"12px 16px",borderRadius:8,marginBottom:16,border:"1px solid var(--gold-dim)",background:"rgba(201,168,76,0.05)",display:"flex",alignItems:"center",gap:10 }}>
                  <AlertCircle size={16} color="var(--gold)"/>
                  <span style={{ fontSize:13,color:"var(--gold)",fontWeight:500 }}>Not yet verified on-chain</span>
                </div>
                <p style={{ fontSize:13,color:"var(--text-muted)",lineHeight:1.7,marginBottom:20 }}>
                  This proof exists in the registry but has not been independently verified. Verifying costs <strong style={{ color:"var(--text)" }}>0.001 STX</strong> and creates a permanent on-chain receipt.
                </p>
                <VerifyButton hash={hash} fullWidth/>
              </>
            )}
          </div>
        </div>
        <div style={{ border:"1px solid var(--border)",borderRadius:12,background:"var(--surface)",padding:24 }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:600,marginBottom:16 }}>What This Proof Means</h2>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16 }}>
            {[
              { icon:<Hash size={16}/>, title:"Hash Match", desc:"The SHA-256 hash proves this exact file was registered. One changed byte produces a completely different hash." },
              { icon:<Clock size={16}/>, title:"Timestamp Proof", desc:"The block height provides a cryptographic timestamp. Your document provably existed at this point in time." },
              { icon:<Shield size={16}/>, title:"Bitcoin Anchored", desc:"Via Stacks, this proof is anchored to Bitcoin's proof-of-work chain — one of the most secure ledgers ever built." },
            ].map((item,i) => (
              <div key={i} style={{ padding:16,borderRadius:8,border:"1px solid var(--border)",background:"rgba(42,92,255,0.02)" }}>
                <div style={{ color:"#6b9cff",marginBottom:10 }}>{item.icon}</div>
                <div style={{ fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:6 }}>{item.title}</div>
                <div style={{ fontSize:12,color:"var(--text-muted)",lineHeight:1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
