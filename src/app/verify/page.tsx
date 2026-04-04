"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Shield, Upload, Hash, Loader2, CheckCircle, AlertCircle, Zap, FileText, ArrowRight } from "lucide-react";
import { CONTRACT_ADDRESS, VERIFIER_CONTRACT, hexToUint8Array } from "@/lib/stacks";

type Step = "input"|"hashing"|"confirm"|"submitting"|"success"|"error";

export default function VerifyPage() {
  const [step, setStep] = useState<Step>("input");
  const [hashInput, setHashInput] = useState("");
  const [fileHash, setFileHash] = useState<string|null>(null);
  const [txId, setTxId] = useState<string|null>(null);
  const [errorMsg, setErrorMsg] = useState<string|null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string|null>(null);
  const activeHash = fileHash || hashInput.trim();

  async function hashFile(file: File) {
    setStep("hashing"); setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const hash = await crypto.subtle.digest("SHA-256", buf);
      const hex = Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");
      setFileHash(hex); setStep("confirm");
    } catch { setErrorMsg("Failed to hash file."); setStep("error"); }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0]; if(file) hashFile(file);
  }
  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if(file) hashFile(file);
  }

  async function submit() {
    if (!activeHash) return;
    setStep("submitting"); setErrorMsg(null);
    try {
      const { openContractCall } = await import("@stacks/connect");
      const { bufferCV, PostConditionMode } = await import("@stacks/transactions");
      const { StacksMainnet } = await import("@stacks/network");
      await openContractCall({
        network: new StacksMainnet(),
        contractAddress: CONTRACT_ADDRESS, contractName: VERIFIER_CONTRACT,
        functionName: "verify-proof", functionArgs: [bufferCV(hexToUint8Array(activeHash))],
        postConditionMode: PostConditionMode.Allow, postConditions: [],
        appDetails: { name:"ProofLedger Verifier", icon:"/icon.svg" },
        onFinish: (data: { txId: string }) => { setTxId(data.txId); setStep("success"); },
        onCancel: () => setStep("confirm"),
      });
    } catch(err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg.includes("wallet") ? "Install Leather or Xverse wallet." : "Transaction failed.");
      setStep("error");
    }
  }

  function reset() { setStep("input"); setHashInput(""); setFileHash(null); setFileName(null); setTxId(null); setErrorMsg(null); }

  const cardStyle = { border:"1px solid var(--border-light)",borderRadius:12,background:"var(--surface)",overflow:"hidden" } as const;

  return (
    <div style={{ minHeight:"100vh" }}>
      <Navbar/>
      <main style={{ maxWidth:680,margin:"0 auto",padding:"60px 24px" }}>
        <div style={{ textAlign:"center",marginBottom:48 }}>
          <div style={{ width:64,height:64,borderRadius:16,margin:"0 auto 20px",background:"linear-gradient(135deg,rgba(42,92,255,0.15),rgba(0,200,150,0.08))",border:"1px solid rgba(42,92,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Shield size={28} color="#6b9cff"/>
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:600,color:"var(--text)",marginBottom:12,lineHeight:1.2 }}>Verify a Document</h1>
          <p style={{ color:"var(--text-muted)",fontSize:15,lineHeight:1.6,maxWidth:480,margin:"0 auto" }}>Upload your file or paste its SHA-256 hash to create a cryptographic verification record on Bitcoin.</p>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 20px",borderRadius:10,marginBottom:36,border:"1px solid rgba(201,168,76,0.2)",background:"rgba(201,168,76,0.04)" }}>
          <Zap size={16} color="var(--gold)"/>
          <div>
            <span style={{ fontSize:13,color:"var(--text)",fontWeight:500 }}>Verification Fee: 0.001 STX</span>
            <span style={{ fontSize:12,color:"var(--text-muted)",marginLeft:10 }}>Spent on-chain · Creates permanent receipt · Boosts proof credibility</span>
          </div>
        </div>

        {(step==="input"||step==="hashing") && (
          <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
            <div onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={handleDrop}
              style={{ border:`2px dashed ${dragging?"var(--accent)":"var(--border-light)"}`,borderRadius:12,padding:"40px 24px",background:dragging?"rgba(42,92,255,0.04)":"var(--surface)",textAlign:"center",cursor:"pointer",transition:"all 0.2s" }}
              onClick={()=>document.getElementById("fi")?.click()}>
              <input id="fi" type="file" style={{ display:"none" }} onChange={handleFileInput}/>
              {step==="hashing"
                ? <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:12 }}><Loader2 size={32} color="var(--accent)" style={{ animation:"spin 1s linear infinite" }}/><p style={{ color:"var(--text-muted)",fontSize:14 }}>Computing SHA-256…</p></div>
                : <><Upload size={32} style={{ color:"var(--text-muted)",margin:"0 auto 12px" }}/><p style={{ fontSize:15,color:"var(--text)",fontWeight:500,marginBottom:6 }}>Drop any file here</p><p style={{ fontSize:13,color:"var(--text-muted)" }}>Hashed locally in your browser. Never uploaded.</p></>
              }
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:12 }}>
              <div style={{ flex:1,height:1,background:"var(--border)" }}/><span style={{ fontSize:12,color:"var(--text-muted)" }}>or paste hash</span><div style={{ flex:1,height:1,background:"var(--border)" }}/>
            </div>
            <div style={{ position:"relative" }}>
              <Hash size={16} style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)" }}/>
              <input type="text" value={hashInput} onChange={e=>setHashInput(e.target.value)} placeholder="SHA-256 hash (64 hex chars)"
                style={{ width:"100%",background:"var(--surface)",border:"1px solid var(--border-light)",borderRadius:10,padding:"13px 14px 13px 42px",color:"var(--text)",fontSize:13,fontFamily:"'IBM Plex Mono',monospace",outline:"none" }}
                onFocus={e=>e.currentTarget.style.borderColor="var(--accent)"} onBlur={e=>e.currentTarget.style.borderColor="var(--border-light)"}/>
            </div>
            <button disabled={!hashInput.trim()||hashInput.trim().length!==64} onClick={()=>setStep("confirm")}
              style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"13px",borderRadius:10,background:"linear-gradient(135deg,#2a5cff,#1a3dcc)",color:"white",fontSize:15,fontWeight:500,border:"none",cursor:"pointer",opacity:(!hashInput.trim()||hashInput.trim().length!==64)?0.4:1,boxShadow:"0 0 24px rgba(42,92,255,0.25)",fontFamily:"'DM Sans',sans-serif" }}>
              Continue <ArrowRight size={16}/>
            </button>
          </div>
        )}

        {step==="confirm" && (
          <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
            <div style={cardStyle}>
              <div style={{ padding:"16px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10 }}><FileText size={15} color="var(--accent)"/><span style={{ fontSize:13,fontWeight:500 }}>Confirm Verification</span></div>
              <div style={{ padding:20,display:"flex",flexDirection:"column",gap:16 }}>
                {fileName && <div style={{ display:"flex",justifyContent:"space-between",fontSize:13 }}><span style={{ color:"var(--text-muted)" }}>File</span><span style={{ color:"var(--text)",fontWeight:500 }}>{fileName}</span></div>}
                <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                  <span style={{ fontSize:12,color:"var(--text-muted)" }}>SHA-256 Hash</span>
                  <code style={{ fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--accent)",wordBreak:"break-all",padding:"8px 12px",borderRadius:6,background:"rgba(42,92,255,0.08)",border:"1px solid rgba(42,92,255,0.15)" }}>{activeHash}</code>
                </div>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:13 }}><span style={{ color:"var(--text-muted)" }}>Contract</span><code style={{ fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--text-muted)" }}>{CONTRACT_ADDRESS.slice(0,8)}…{VERIFIER_CONTRACT}</code></div>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:13 }}><span style={{ color:"var(--text-muted)" }}>Verification Fee</span><span style={{ color:"var(--gold)",fontWeight:600,fontFamily:"'IBM Plex Mono',monospace" }}>0.001 STX</span></div>
              </div>
            </div>
            <div style={{ display:"flex",gap:12 }}>
              <button onClick={reset} style={{ flex:1,padding:"13px",borderRadius:10,border:"1px solid var(--border-light)",background:"transparent",color:"var(--text-muted)",fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif" }}>Back</button>
              <button onClick={submit} style={{ flex:2,display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"13px",borderRadius:10,background:"linear-gradient(135deg,#2a5cff,#1a3dcc)",color:"white",fontSize:15,fontWeight:500,border:"none",cursor:"pointer",boxShadow:"0 0 24px rgba(42,92,255,0.3)",fontFamily:"'DM Sans',sans-serif" }}>
                <Shield size={16}/>Pay 0.001 STX & Verify
              </button>
            </div>
          </div>
        )}

        {step==="submitting" && (
          <div style={{ textAlign:"center",padding:"60px 24px" }}>
            <Loader2 size={40} color="var(--accent)" style={{ margin:"0 auto 20px",animation:"spin 1s linear infinite" }}/>
            <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:22,color:"var(--text)",marginBottom:10 }}>Awaiting wallet confirmation…</h2>
            <p style={{ color:"var(--text-muted)",fontSize:14 }}>Approve the transaction in your wallet to complete verification.</p>
          </div>
        )}

        {step==="success" && (
          <div style={{ textAlign:"center",padding:"40px 24px",border:"1px solid var(--green-dim)",borderRadius:16,background:"rgba(0,200,150,0.06)" }}>
            <CheckCircle size={48} color="var(--green)" style={{ margin:"0 auto 20px" }}/>
            <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:26,color:"var(--text)",marginBottom:10 }}>Verification Submitted</h2>
            <p style={{ color:"var(--text-muted)",fontSize:14,lineHeight:1.7,marginBottom:24 }}>Once confirmed on-chain, this proof will carry a permanent verification record.</p>
            {txId && <a href={`https://explorer.hiro.so/txid/${txId}?chain=mainnet`} target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"10px 20px",borderRadius:8,border:"1px solid var(--green-dim)",color:"var(--green)",textDecoration:"none",fontSize:13,fontFamily:"'IBM Plex Mono',monospace",marginBottom:20 }}>View tx: {txId.slice(0,14)}…</a>}
            <div style={{ display:"flex",gap:12,justifyContent:"center" }}>
              <button onClick={reset} style={{ padding:"10px 20px",borderRadius:8,border:"1px solid var(--border-light)",background:"transparent",color:"var(--text-muted)",fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif" }}>Verify Another</button>
              {activeHash && <a href={`/proof/${activeHash}`} style={{ padding:"10px 20px",borderRadius:8,border:"1px solid rgba(42,92,255,0.3)",background:"rgba(42,92,255,0.08)",color:"#6b9cff",textDecoration:"none",fontSize:13 }}>View Proof Record →</a>}
            </div>
          </div>
        )}

        {step==="error" && (
          <div style={{ textAlign:"center",padding:"40px 24px",border:"1px solid rgba(224,90,90,0.3)",borderRadius:16,background:"rgba(224,90,90,0.04)" }}>
            <AlertCircle size={40} color="var(--red)" style={{ margin:"0 auto 20px" }}/>
            <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:22,color:"var(--text)",marginBottom:10 }}>Something went wrong</h2>
            <p style={{ color:"var(--text-muted)",fontSize:14,marginBottom:24 }}>{errorMsg}</p>
            <button onClick={reset} style={{ padding:"10px 24px",borderRadius:8,border:"1px solid var(--border-light)",background:"transparent",color:"var(--text)",fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif" }}>Try Again</button>
          </div>
        )}
      </main>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
