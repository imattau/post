"use client";

import { useRelaysStore } from "@/lib/stores/relays";

export default function RelayBanner() {
  const relayStatuses = useRelaysStore((s) => s.statuses);
  const relayConnected = Object.values(relayStatuses).some((s) => s.connected);
  const totalCount = Object.keys(relayStatuses).length;

  if (totalCount === 0 || relayConnected) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-30 h-9 bg-danger/20 border-b border-danger/30 flex items-center justify-center">
      <span className="text-danger text-[12px] font-medium">
        Unable to connect to relays. Check your network connection.
      </span>
      <button
        onClick={() => useRelaysStore.getState().connect()}
        className="ml-3 text-[11px] font-semibold text-white bg-danger/40 px-2.5 py-0.5 rounded cursor-pointer hover:bg-danger/60 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
