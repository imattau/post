"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIdentityStore } from "@/lib/stores/identity";
import BackLink from "@/components/login/BackLink";

export default function ProfileSetupPage() {
  const router = useRouter();
  const identity = useIdentityStore((s) => s.identity);
  const publishProfile = useIdentityStore((s) => s.publishProfile);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [about, setAbout] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = identity?.npub
    ? identity.npub.slice(5, 7).toUpperCase()
    : "?";

  const handleContinue = async () => {
    setSaving(true);
    setError(null);
    try {
      await publishProfile({ displayName, username, about });
      router.push("/mail/inbox");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.push("/mail/inbox");
  };

  return (
    <div className="pt-[150px] pl-[48px]">
      <BackLink href="/login" />

      <h1 className="text-[28px] font-semibold text-text-primary mt-8">Set up your profile</h1>
      <p className="text-[13px] text-text-secondary mt-1 max-w-[425px]">
        Your identity is ready. Add enough detail for people to recognise you.
      </p>

      <div className="flex items-end gap-4 mt-[38px]">
        <div className="flex items-center justify-center w-[86px] h-[86px] rounded-full bg-pill-subtle border border-border shrink-0">
          <span className="text-[22px] font-semibold text-text-secondary">{initials}</span>
        </div>
        <button className="h-[36px] w-[128px] rounded-[10px] bg-sidebar border border-border text-[11px] font-medium text-text-secondary cursor-pointer hover:bg-pill-subtle transition-all">
          Add picture
        </button>
      </div>

      <label className="block text-[11px] font-medium text-text-secondary mt-[30px]">
        Display name
      </label>
      <input
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        className="mt-2 w-[624px] h-[48px] rounded-[12px] bg-sidebar border border-border px-4 text-[12px] text-text-near-white outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />

      <label className="block text-[11px] font-medium text-text-secondary mt-4">
        Username or NIP-05
      </label>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="mt-2 w-[624px] h-[48px] rounded-[12px] bg-sidebar border border-border px-4 text-[12px] text-text-near-white outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />

      <label className="block text-[11px] font-medium text-text-secondary mt-4">
        About
      </label>
      <textarea
        value={about}
        onChange={(e) => setAbout(e.target.value)}
        placeholder="A short introduction..."
        className="mt-2 w-[624px] h-[104px] rounded-[12px] bg-sidebar border border-border px-4 py-3 text-[12px] text-text-near-white outline-none resize-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-text-tertiary"
      />

      {error && (
        <p className="text-[11px] text-danger mt-3">{error}</p>
      )}

      <button
        onClick={handleContinue}
        disabled={saving}
        className="mt-6 w-[624px] h-[50px] rounded-[13px] bg-brand text-white text-[13px] font-semibold cursor-pointer disabled:opacity-40 hover:brightness-110 transition-all"
      >
        {saving ? "Saving..." : "Continue to Post"}
      </button>

      <button
        onClick={handleSkip}
        className="block mt-3 text-[11px] font-medium text-brand-light cursor-pointer hover:brightness-110 transition-all"
      >
        Skip for now
      </button>
    </div>
  );
}
