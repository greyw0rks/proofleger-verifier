"use client";
import { useState, useCallback } from "react";
import { getVerificationRecord } from "@/lib/verify-client";
import { isValidHash } from "@/lib/hash-utils";

export function useVerification() {
  const [status, setStatus] = useState<"idle"|"loading"|"verified"|"unverified"|"error">("idle");
  const [record, setRecord] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async (hash: string) => {
    if (!isValidHash(hash)) { setError("Invalid hash format"); setStatus("error"); return; }
    setStatus("loading"); setError(null); setRecord(null);
    try {
      const result = await getVerificationRecord(hash);
      setRecord(result);
      setStatus(result ? "verified" : "unverified");
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification check failed");
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle"); setRecord(null); setError(null);
  }, []);

  return {
    check, reset, status, record, error,
    isVerified: status === "verified",
    isLoading: status === "loading",
  };
}