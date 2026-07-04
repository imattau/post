"use client";

import Avatar from "@/components/Avatar";

export default function GuestsRow({
  guests,
  size = 26,
}: {
  guests: { id: string; initials: string; name: string; accepted: boolean }[];
  size?: number;
}) {
  if (guests.length === 0) return null;
  return (
    <div className="flex items-center">
      {guests.slice(0, 3).map((guest, index) => (
        <div
          key={guest.id}
          className={`-ml-1 ${index === 0 ? "ml-0" : ""} rounded-full ring-2 ring-[#151922]`}
          title={guest.name}
        >
          <Avatar initials={guest.initials} size={size} />
        </div>
      ))}
      {guests.length > 3 && (
        <div className="-ml-1 flex h-[26px] w-[26px] items-center justify-center rounded-full border border-border bg-pill-subtle text-[10px] font-medium text-text-secondary ring-2 ring-[#151922]">
          +{guests.length - 3}
        </div>
      )}
    </div>
  );
}
