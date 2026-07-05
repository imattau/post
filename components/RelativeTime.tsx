"use client";

import { useState, useEffect } from "react";
import { formatRelativeTime } from "@/lib/utils";

export default function RelativeTime({ ts }: { ts: number }) {
  const [label, setLabel] = useState(() => formatRelativeTime(ts));

  useEffect(() => {
    setLabel(formatRelativeTime(ts));
    const interval = setInterval(() => setLabel(formatRelativeTime(ts)), 60_000);
    return () => clearInterval(interval);
  }, [ts]);

  return <>{label}</>;
}
