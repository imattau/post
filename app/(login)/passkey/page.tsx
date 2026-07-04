"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIdentityStore } from "@/lib/stores/identity";
import { isTauri } from "@/lib/tauri";
import BackLink from "@/components/login/BackLink";

export default function PasskeyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recoveryToggle, setRecoveryToggle] = useState(false);
  const createPasskeyIdentity = useIdentityStore((s) => s.createPasskeyIdentity);
  const unlockPasskeyIdentity = useIdentityStore((s) => s.unlockPasskeyIdentity);

  useEffect(() => {
    if (isTauri()) {
      router.replace("/login");
    }
  }, [router]);

  const handleCreate = async () => {
    setLoading("create");
    setError(null);
    try {
      await createPasskeyIdentity();
      router.push("/login/profile-setup");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create passkey identity");
    } finally {
      setLoading(null);
    }
  };

  const handleUnlock = async () => {
    setLoading("unlock");
    setError(null);
    try {
      await unlockPasskeyIdentity();
      router.push("/mail/inbox");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to unlock passkey identity");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="pt-[150px] pl-[48px]">
      <BackLink href="/login" />

      <h1 className="text-[28px] font-semibold text-text-primary mt-8">Continue with passkey</h1>
      <p className="text-[13px] text-text-secondary mt-1">
        Create or unlock a protected local Nostr identity.
      </p>

      <div className="mt-[38px] w-[624px] h-[108px] rounded-[14px] bg-sidebar border border-border p-5">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-[48px] h-[48px] rounded-[12px] bg-pill-subtle border border-ok shrink-0">
            <span className="font-bold text-[14px] text-ok">PK</span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-text-primary">Uses your device authentication</p>
            <p className="text-[10px] text-text-secondary mt-2 max-w-[480px]">
              Fingerprint, face unlock, PIN or security key.
            </p>
          </div>
        </div>
      </div>

      <p className="text-[11px] font-medium text-text-secondary mt-[30px]">Choose an option</p>

      <button
        onClick={handleCreate}
        disabled={loading !== null}
        className="mt-3 w-[624px] h-[72px] rounded-[14px] bg-surface-active border border-brand text-left px-5 cursor-pointer disabled:opacity-40 hover:brightness-110 transition-all"
      >
        <p className="text-[13px] font-semibold text-text-primary">Create a new Nostr identity</p>
        <p className="text-[10px] text-text-secondary mt-1">Generate a new key and protect it with a passkey.</p>
      </button>

      <button
        onClick={handleUnlock}
        disabled={loading !== null}
        className="mt-3 w-[624px] h-[72px] rounded-[14px] bg-sidebar border border-border text-left px-5 cursor-pointer disabled:opacity-40 hover:bg-pill-subtle transition-all"
      >
        <p className="text-[13px] font-semibold text-text-primary">Unlock existing passkey identity</p>
        <p className="text-[10px] text-text-secondary mt-1">Use a passkey already created for this suite.</p>
      </button>

      {error && (
        <p className="text-[11px] text-danger mt-3">{error}</p>
      )}

      {loading && (
        <p className="text-[11px] text-text-secondary mt-3">
          {loading === "create" ? "Creating passkey identity..." : "Unlocking passkey identity..."}
        </p>
      )}

      <div className="mt-[38px] w-[624px] h-[170px] rounded-[14px] bg-sidebar border border-border p-5">
        <p className="text-[12px] font-semibold text-text-primary">Recovery</p>
        <p className="text-[11px] text-text-secondary mt-3 max-w-[550px]">
          Create an encrypted recovery package or connect a remote signer as backup.
        </p>
        <label className="flex items-center gap-3 mt-5 cursor-pointer">
          <div
            onClick={() => setRecoveryToggle(!recoveryToggle)}
            className={`w-[44px] h-[24px] rounded-[12px] border relative transition-colors cursor-pointer ${
              recoveryToggle ? "bg-brand border-brand" : "bg-pill-subtle border-border"
            }`}
          >
            <div
              className={`w-[20px] h-[20px] rounded-full bg-white absolute top-[1px] transition-all ${
                recoveryToggle ? "left-[21px]" : "left-[1px]"
              }`}
            />
          </div>
          <span className="text-[11px] font-medium text-text-primary">Prompt me to create a recovery backup</span>
        </label>
      </div>
    </div>
  );
}
