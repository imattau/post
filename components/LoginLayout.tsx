"use client";

import type { ReactNode } from "react";
import AppFeatureCard from "@/components/login/AppFeatureCard";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh">
      <div className="w-[576px] shrink-0 bg-dock p-7 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-[44px] h-[44px] rounded-[14px] bg-brand shrink-0">
            <span className="font-bold text-[18px] text-white">N</span>
          </div>
          <span className="text-[15px] font-semibold text-text-near-white">Nostr Suite</span>
        </div>

        <div className="flex-1 flex flex-col justify-center px-7">
          <h1 className="text-[42px] font-bold text-text-near-white leading-[1.2] whitespace-pre-line">
            {"One identity.\nEvery app."}
          </h1>
          <p className="text-[16px] text-text-secondary mt-4 leading-relaxed max-w-[420px]">
            Post, Drive, Calendar and Notes connected through your Nostr identity.
          </p>

          <div className="mt-16 flex flex-col gap-3">
            <AppFeatureCard letter="P" color="#8B5CF6" title="Post" description="Shared identity and permissions" />
            <AppFeatureCard letter="D" color="#60A5FA" title="Drive" description="Shared identity and permissions" />
            <AppFeatureCard letter="C" color="#34D399" title="Calendar" description="Shared identity and permissions" />
            <AppFeatureCard letter="N" color="#FBBF24" title="Notes" description="Shared identity and permissions" />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-canvas overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
