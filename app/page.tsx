"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIdentityStore } from "@/lib/stores/identity";
import { createKeyStore } from "@post/nostr-core";
import LoginLayout from "@/components/LoginLayout";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const keyStore = createKeyStore();
    keyStore.load().then((existing) => {
      if (existing) {
        router.replace("/mail/inbox");
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  if (checking) return null;

  return (
    <LoginLayout>
      <div className="pt-[82px] pl-[48px]">
        <h1 className="text-[30px] font-semibold text-text-primary">
          Post
        </h1>
        <p className="text-[13px] text-text-secondary mt-1">
          Private messaging for Nostr.
        </p>

        <div className="mt-[52px] max-w-[624px]">
          <button
            onClick={() => router.push("/login")}
            className="flex items-center w-full h-[88px] rounded-[14px] border border-brand bg-surface-active px-4 text-left transition-all hover:bg-brand/20 cursor-pointer"
          >
            <div className="flex items-center justify-center w-[48px] h-[48px] rounded-[12px] bg-pill-subtle shrink-0">
              <span className="font-bold text-[14px] text-brand-light">P</span>
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-text-near-white">
                Log in to Post
              </p>
              <p className="text-[10px] font-normal text-text-tertiary mt-1">
                Sign in with passkey, browser extension, or your nsec key.
              </p>
            </div>
            <span className="text-[20px] font-medium text-brand-light ml-2 shrink-0">
              ›
            </span>
          </button>
        </div>

        <div className="mt-[52px] flex flex-col gap-5 max-w-[600px]">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-[30px] h-[30px] rounded-[8px] bg-pill-subtle shrink-0 mt-0.5">
              <span className="font-bold text-[11px] text-brand">I</span>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-text-primary">
                Email-styled inbox
              </p>
              <p className="text-[11px] text-text-secondary mt-1">
                Post brings the familiar email experience to Nostr. End-to-end
                encrypted direct messages organized in an intuitive inbox with
                labels, threading, and search.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-[30px] h-[30px] rounded-[8px] bg-pill-subtle shrink-0 mt-0.5">
              <span className="font-bold text-[11px] text-ok">E</span>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-text-primary">
                End-to-end encrypted
              </p>
              <p className="text-[11px] text-text-secondary mt-1">
                Messages are encrypted using NIP-17 and NIP-44, ensuring only
                you and your recipient can read them.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-[30px] h-[30px] rounded-[8px] bg-pill-subtle shrink-0 mt-0.5">
              <span className="font-bold text-[11px] text-info">L</span>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-text-primary">
                Labels &amp; filters
              </p>
              <p className="text-[11px] text-text-secondary mt-1">
                Organize conversations with custom labels, star important
                messages, and filter by category.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-[30px] h-[30px] rounded-[8px] bg-pill-subtle shrink-0 mt-0.5">
              <span className="font-bold text-[11px] text-teal">F</span>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-text-primary">
                Attachments &amp; files
              </p>
              <p className="text-[11px] text-text-secondary mt-1">
                Share images and files directly in messages with Blossom server
                support and inline previews.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-[30px] h-[30px] rounded-[8px] bg-pill-subtle shrink-0 mt-0.5">
              <span className="font-bold text-[11px] text-warn">K</span>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-text-primary">
                Multiple identities
              </p>
              <p className="text-[11px] text-text-secondary mt-1">
                Sign in with passkeys, browser extensions (NIP-07), remote
                signers (NIP-46), or import an existing nsec key.
              </p>
            </div>
          </div>
        </div>
      </div>
    </LoginLayout>
  );
}
