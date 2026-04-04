"use client";
import { useState } from "react";
import { Shield, Loader2, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { CONTRACT_ADDRESS, VERIFIER_CONTRACT, hexToUint8Array } from "@/lib/stacks";
interface Props { hash: string; fullWidth?: boolean; }
type Status = "idle"|"pending"|"success"|"error";
export default function VerifyButton({ hash, fullWidth=false }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [txId, setTxId] = useState<string|null>(null);
  const [errorMsg, setErrorMsg] = useState<string|null>(null);
  const handleVerify = async () => {
    setStatus("pending"); setErrorMsg(null);
    try {
      const { openContractCall } = await import("@stacks/connect");
      const { bufferCV, PostConditionMode } = await import("@stacks/transactions");
      const { StacksMainnet } = await import("@stacks/network");
      await openContractCall({
        network: new StacksMainnet(),
        contractAddress: CONTRACT_ADDRESS, contractName: VERIFIER_CONTRACT,
        functionName: "verify-proof", functionArgs: [bufferCV(hexToUint8Array(hash))],
        postConditionMode: PostConditionMode.Allow, postConditions: [],
        appDetails: { name: "ProofLedger Verifier", icon: "/icon.svg" },
        onFinish: (data: { txId: string }) => { setTxId(data.txId); setStatus("success"); },
        onCancel: () => setStatus("idle"),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg.includes("wallet") ? "Install Leather or Xverse wallet." : "Transaction failed.");
      setStatus("error");
    }
  };
  if (status === "success") return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:fullWidth?"stretch":"flex-end",gap:6 }}>
      <div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 18px",borderRadius:8,border:"1px solid var(--green-dim)",background:"rgba(0,200,150,0.08)" }}>
        <CheckCircle size={15} color="var(--green)" />
        <span style={{ fontSize:13,color:"var(--green)",fontWeight:500 }}>Verification submitted!</span>
      </div>
      {txId && <a href={`https://explorer.hiro.so/txid/${txId}?chain=mainnet`} target="_blank" rel="noopener noreferrer" style={{ fontSize:11,color:"var(--accent)",fontFamily:"'IBM Plex Mono',monospace" }}>tx: {txId.slice(0,12)}…</a>}
    </div>
  );
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:6,width:fullWidth?"100%":"auto" }}>
      <button onClick={handleVerify} disabled={status==="pending"} style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"11px 22px",borderRadius:8,background:status==="error"?"rgba(224,90,90,0.1)":"linear-gradient(135deg,#2a5cff,#1a3dcc)",border:status==="error"?"1px solid var(--red)":"none",color:"white",fontSize:14,fontWeight:500,cursor:status==="pending"?"not-allowed":"pointer",opacity:status==="pending"?0.7:1,width:fullWidth?"100%":"auto",fontFamily:"'DM Sans',sans-serif",boxShadow:status==="error"?"none":"0 0 20px rgba(42,92,255,0.3)" }}>
        {status==="pending" ? <><Loader2 size={15} style={{ animation:"spin 1s linear infinite" }}/>Awaiting wallet…</> : status==="error" ? <><AlertCircle size={15} style={{ color:"var(--red)" }}/><span style={{ color:"var(--red)" }}>Retry</span></> : <><Shield size={15}/>Verify On-Chain</>}
      </button>
      {status==="idle" && <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:11,color:"var(--text-muted)" }}><Zap size={11}/>0.001 STX · On-chain receipt</div>}
      {status==="error" && errorMsg && <p style={{ fontSize:12,color:"var(--red)",textAlign:"center" }}>{errorMsg}</p>}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
