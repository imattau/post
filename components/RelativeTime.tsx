"use client";

import TimeAgo from "react-timeago";

export default function RelativeTime({ ts }: { ts: number }) {
  return <TimeAgo date={ts} />;
}
