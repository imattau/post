"use client";

import { useRouter } from "next/navigation";

export default function BackLink({ href }: { href: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className="text-[11px] font-medium text-brand-light hover:brightness-110 transition-all cursor-pointer"
    >
      ← Back
    </button>
  );
}
