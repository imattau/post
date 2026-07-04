"use client";

import { Toaster } from "sonner";
import IconDock from "@/components/IconDock";
import { useIdentityStore } from "@/lib/stores/identity";
import PasskeyReauthModal from "@/components/login/PasskeyReauthModal";

export default function SuiteLayout({ children }: { children: React.ReactNode }) {
  const needsPasskeyReauth = useIdentityStore((s) => s.needsPasskeyReauth);
  return (
    <div className="flex h-dvh">
      <IconDock />
      {children}
      <Toaster />
      {needsPasskeyReauth && <PasskeyReauthModal />}
    </div>
  );
}
