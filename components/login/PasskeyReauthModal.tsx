"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIdentityStore } from "@/lib/stores/identity";

export default function PasskeyReauthModal() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unlockPasskeyIdentity = useIdentityStore((s) => s.unlockPasskeyIdentity);
  const logout = useIdentityStore((s) => s.logout);

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      await unlockPasskeyIdentity();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to verify passkey");
      setLoading(false);
    }
  };

  const handleSwitch = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[420px] rounded-[18px] bg-canvas border border-border p-8 shadow-xl">
        <div className="flex items-center justify-center w-[56px] h-[56px] rounded-[14px] bg-pill-subtle border border-ok mx-auto">
          <span className="font-bold text-[16px] text-ok">PK</span>
        </div>

        <h2 className="text-[20px] font-semibold text-text-primary text-center mt-5">
          Verify your passkey
        </h2>
        <p className="text-[12px] text-text-secondary text-center mt-2 leading-relaxed">
          Sign in with your passkey to continue using this identity.
          Your private key is never stored on this device.
        </p>

        {error && (
          <p className="text-[11px] text-danger text-center mt-4">{error}</p>
        )}

        <button
          onClick={handleVerify}
          disabled={loading}
          className="mt-6 w-full h-[50px] rounded-[13px] bg-brand text-white text-[13px] font-semibold cursor-pointer disabled:opacity-40 hover:brightness-110 transition-all"
        >
          {loading ? "Verifying..." : "Verify with passkey"}
        </button>

        <button
          onClick={handleSwitch}
          disabled={loading}
          className="mt-3 w-full h-[50px] rounded-[13px] bg-sidebar border border-border text-text-primary text-[13px] font-semibold cursor-pointer hover:bg-pill-subtle transition-all"
        >
          Use a different sign-in method
        </button>
      </div>
    </div>
  );
}
