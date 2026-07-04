"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIdentityStore } from "@/lib/stores/identity";
import BackLink from "@/components/login/BackLink";

export default function ExistingKeyPage() {
  const router = useRouter();
  const [nsec, setNsec] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [remember, setRemember] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createOrImport = useIdentityStore((s) => s.createOrImport);

  const handleUnlock = async () => {
    if (!nsec.trim()) return;
    setImporting(true);
    setError(null);
    try {
      await createOrImport(nsec.trim());
      router.push("/mail/inbox");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid nsec");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="pt-[150px] pl-[48px]">
      <BackLink href="/login" />

      <h1 className="text-[28px] font-semibold text-text-primary mt-8">Use existing key</h1>
      <p className="text-[13px] text-text-secondary mt-1">
        Enter an nsec only when another signing method is unavailable.
      </p>

      <div className="mt-[38px] w-[624px] h-[112px] rounded-[14px] bg-sidebar border border-danger p-5">
        <div className="flex items-start gap-3">
          <div className="w-[10px] h-[10px] rounded-full bg-danger mt-1 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-text-primary">Security warning</p>
            <p className="text-[11px] text-text-secondary mt-2 max-w-[560px]">
              Anyone with this key controls the identity. Avoid shared devices.
            </p>
          </div>
        </div>
      </div>

      <label className="block text-[11px] font-medium text-text-secondary mt-[30px]">
        Private key
      </label>
      <div className="relative mt-2">
        <input
          type={showKey ? "text" : "password"}
          value={nsec}
          onChange={(e) => setNsec(e.target.value)}
          placeholder="nsec1••••••••••••••••••••••••"
          className="w-[624px] h-[56px] rounded-[12px] bg-sidebar border border-border px-5 text-[12px] text-text-near-white outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
        />
        <button
          onClick={() => setShowKey(!showKey)}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-brand-light cursor-pointer hover:brightness-110"
        >
          {showKey ? "Hide" : "Show"}
        </button>
      </div>

      {error && (
        <p className="text-[11px] text-danger mt-3">{error}</p>
      )}

      <button
        onClick={handleUnlock}
        disabled={!nsec.trim() || importing}
        className="mt-4 w-[624px] h-[50px] rounded-[13px] bg-brand text-white text-[13px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
      >
        {importing ? "Importing..." : "Unlock identity"}
      </button>

      <div className="mt-[38px] w-[624px] h-[170px] rounded-[14px] bg-sidebar border border-border p-5">
        <p className="text-[12px] font-semibold text-text-primary">Local handling</p>
        <div className="mt-4 text-[11px] text-text-secondary space-y-1 max-w-[550px]">
          <p>• Encrypted before local storage</p>
          <p>• Never uploaded to relays or providers</p>
          <p>• Switch signers later</p>
        </div>
        <label className="flex items-center gap-3 mt-5 cursor-pointer">
          <div
            onClick={() => setRemember(!remember)}
            className={`w-[44px] h-[24px] rounded-[12px] border relative transition-colors cursor-pointer ${
              remember ? "bg-brand border-brand" : "bg-pill-subtle border-border"
            }`}
          >
            <div
              className={`w-[20px] h-[20px] rounded-full bg-white absolute top-[1px] transition-all ${
                remember ? "left-[21px]" : "left-[1px]"
              }`}
            />
          </div>
          <span className="text-[11px] font-medium text-text-primary">Remember on this device</span>
        </label>
      </div>
    </div>
  );
}
