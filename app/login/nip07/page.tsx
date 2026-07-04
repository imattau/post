"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIdentityStore } from "@/lib/stores/identity";
import BackLink from "@/components/login/BackLink";

export default function Nip07Page() {
  const router = useRouter();
  const [detected, setDetected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectNip07 = useIdentityStore((s) => s.connectNip07);

  useEffect(() => {
    setDetected(typeof window !== "undefined" && !!window.nostr);
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      await connectNip07();
      router.push("/mail/inbox");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="pt-[150px] pl-[48px]">
      <BackLink href="/login" />

      <h1 className="text-[28px] font-semibold text-text-primary mt-8">Connect browser signer</h1>
      <p className="text-[13px] text-text-secondary mt-1">
        Use a NIP-07 extension installed in this browser.
      </p>

      <div className="mt-[38px] w-[624px] h-[150px] rounded-[16px] bg-sidebar border border-border p-6">
        <div className="flex items-start gap-5">
          <div className="flex items-center justify-center w-[56px] h-[56px] rounded-[14px] bg-surface-active border border-brand shrink-0">
            <span className="font-bold text-[18px] text-brand-light">07</span>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-text-primary">Browser signer detected</p>
            <p className="text-[11px] text-text-secondary mt-2 max-w-[470px]">
              The signer approves access and future signing requests.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <div className={`w-[8px] h-[8px] rounded-full ${detected ? "bg-ok" : "bg-danger"}`} />
              <span className={`text-[11px] font-medium ${detected ? "text-ok" : "text-danger"}`}>
                {detected ? "Extension available" : "No extension detected"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-danger mt-3">{error}</p>
      )}

      <button
        onClick={handleConnect}
        disabled={!detected || connecting}
        className="mt-6 w-[624px] h-[50px] rounded-[13px] bg-brand text-white text-[13px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
      >
        {connecting ? "Connecting..." : "Connect signer"}
      </button>
    </div>
  );
}
