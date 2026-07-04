"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIdentityStore } from "@/lib/stores/identity";
import BackLink from "@/components/login/BackLink";

export default function Nip46Page() {
  const router = useRouter();
  const [uri, setUri] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectNip46 = useIdentityStore((s) => s.connectNip46);

  const handleConnect = async () => {
    if (!uri.trim()) return;
    setConnecting(true);
    setError(null);
    try {
      await connectNip46(uri.trim());
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

      <h1 className="text-[28px] font-semibold text-text-primary mt-8">Connect remote signer</h1>
      <p className="text-[13px] text-text-secondary mt-1">
        Pair this browser with a NIP-46 bunker or signing app.
      </p>

      <label className="block text-[11px] font-medium text-text-secondary mt-[38px]">
        Connection URI
      </label>
      <input
        type="text"
        value={uri}
        onChange={(e) => setUri(e.target.value)}
        placeholder="bunker:// or nostrconnect://"
        className="mt-2 w-[624px] h-[52px] rounded-[12px] bg-sidebar border border-border px-5 text-[12px] text-text-tertiary outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        onKeyDown={(e) => e.key === "Enter" && handleConnect()}
      />

      {error && (
        <p className="text-[11px] text-danger mt-3">{error}</p>
      )}

      <button
        onClick={handleConnect}
        disabled={!uri.trim() || connecting}
        className="mt-3 w-[624px] h-[50px] rounded-[13px] bg-brand text-white text-[13px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
      >
        {connecting ? "Connecting..." : "Connect remote signer"}
      </button>

      <p className="text-[11px] text-text-tertiary text-center mt-6 w-[624px]">
        or scan from your signer app
      </p>

      <div className="mt-4 ml-[92px] w-[252px] h-[252px] rounded-[18px] bg-sidebar border border-border flex items-center justify-center">
        <div className="w-[184px] h-[184px] rounded-[10px] bg-white flex items-center justify-center">
          <span className="font-bold text-[28px] text-canvas">QR</span>
        </div>
      </div>
    </div>
  );
}
