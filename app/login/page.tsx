"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIdentityStore } from "@/lib/stores/identity";
import { isTauri, createTauriKeyStore } from "@/lib/tauri";
import OptionCard from "@/components/login/OptionCard";
import { createKeyStore } from "@post/nostr-core";

export default function WelcomePage() {
  const router = useRouter();
  const identity = useIdentityStore((s) => s.identity);
  const createOrImport = useIdentityStore((s) => s.createOrImport);
  const [checked, setChecked] = useState(false);
  const [creating, setCreating] = useState(false);
  const [nip07Available, setNip07Available] = useState(false);
  const [inTauri, setInTauri] = useState(false);

  useEffect(() => {
    setNip07Available(typeof window !== "undefined" && !!window.nostr);
    setInTauri(isTauri());
  }, []);

  useEffect(() => {
    if (checked) return;
    const keyStore = isTauri() ? createTauriKeyStore() : createKeyStore();
    const existing = keyStore.load();
    if (existing) {
      useIdentityStore.getState().setIdentity(existing);
    }
    setChecked(true);
  }, [checked]);

  useEffect(() => {
    if (!checked) return;
    if (identity) {
      router.replace("/mail/inbox");
    }
  }, [identity, checked, router]);

  const handleTauriCreate = async () => {
    setCreating(true);
    await createOrImport();
    router.push("/login/profile-setup");
  };

  return (
    <div className="pt-[82px] pl-[48px]">
      <h1 className="text-[30px] font-semibold text-text-primary">Welcome to Nostr Suite</h1>
      <p className="text-[13px] text-text-secondary mt-1">Sign in or create an identity to continue.</p>

      <div className="mt-[52px] flex flex-col gap-3 max-w-[624px]">
        {inTauri ? (
          <OptionCard
            icon={<span className="font-bold text-[14px] text-ok">OS</span>}
            title="Use OS keychain"
            description="Create a new identity secured by your device's keychain."
            highlighted
            onClick={handleTauriCreate}
            rightElement={
              creating
                ? <span className="text-[11px] text-text-secondary ml-2 shrink-0">Creating...</span>
                : <span className="text-[20px] font-medium text-brand-light ml-2 shrink-0">›</span>
            }
          />
        ) : (
          <OptionCard
            icon={<span className="font-bold text-[14px] text-ok">PK</span>}
            title="Continue with passkey"
            description="Create or unlock a protected local identity."
            highlighted
            onClick={() => router.push("/login/passkey")}
            rightElement={<span className="text-[20px] font-medium text-brand-light ml-2 shrink-0">›</span>}
          />
        )}

        {nip07Available && !inTauri && (
          <OptionCard
            icon={<span className="font-bold text-[14px] text-brand-light">07</span>}
            title="Use browser signer"
            description="Connect a NIP-07 browser extension."
            onClick={() => router.push("/login/nip07")}
          />
        )}

        <OptionCard
          icon={<span className="font-bold text-[14px] text-info">46</span>}
          title="Connect remote signer"
          description="Pair with a NIP-46 bunker or signer app."
          onClick={() => router.push("/login/nip46")}
        />

        <OptionCard
          icon={<span className="font-bold text-[14px] text-warn">NS</span>}
          title="Use existing key"
          description="Enter an nsec locally when no signer is available."
          onClick={() => router.push("/login/existing-key")}
        />
      </div>

      <div className="mt-[52px]">
        <p className="text-[12px] font-semibold text-text-primary">New to Nostr?</p>
        <p className="text-[11px] text-text-secondary mt-2 max-w-[600px]">
          {inTauri
            ? "OS keychain creates a new identity and protects it using your device vault."
            : "Passkey creates a new identity and protects it using your device."}
        </p>
      </div>
    </div>
  );
}
