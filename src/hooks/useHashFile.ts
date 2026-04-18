"use client";
import { useState, useCallback } from "react";
import { hashFile, isValidHash } from "@/lib/hash-utils";

export function useHashFile() {
  const [hash, setHash] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [hashing, setHashing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    setHashing(true); setError(null); setHash(null);
    setFileName(file.name); setFileSize(file.size);
    try {
      const h = await hashFile(file);
      setHash(h);
      return h;
    } catch (e) {
      setError("Failed to hash file");
      return null;
    } finally { setHashing(false); }
  }, []);

  const reset = useCallback(() => {
    setHash(null); setFileName(null); setFileSize(null); setError(null);
  }, []);

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/(1024*1024)).toFixed(2)} MB`;
  };

  return {
    processFile, reset, hash, fileName,
    fileSize: formatSize(fileSize), hashing, error,
  };
}