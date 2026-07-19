"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { formatLongDate, formatTimeRange } from "@/lib/calendar";
import { useIdentityStore } from "@/lib/stores/identity";
import type { CalendarEvent, CalendarCalendar } from "@/lib/types";
import GuestsRow from "./GuestsRow";

function badgeVariant(color: string) {
  if (color === "var(--color-info)") return "info";
  if (color === "var(--color-ok)") return "ok";
  if (color === "var(--color-warn)") return "warn";
  if (color === "var(--color-danger)") return "danger";
  return "brand";
}

function invitationLabel(status: string) {
  switch (status) {
    case "accepted": return "Accepted";
    case "pending": return "Pending";
    case "maybe": return "Maybe";
    case "declined": return "Declined";
    default: return status;
  }
}

interface EventDetailsPanelProps {
  event: CalendarEvent;
  calendar: CalendarCalendar | null;
  onClose?: () => void;
  onAccept?: () => void;
  onMaybe?: () => void;
  onDecline?: () => void;
  onDelete?: () => void;
}

export default function EventDetailsPanel({
  event,
  calendar,
  onClose,
  onAccept,
  onMaybe,
  onDecline,
  onDelete,
}: EventDetailsPanelProps) {
  const identity = useIdentityStore((s) => s.identity);
  const guests = event.guests ?? [];

  const signerName = useMemo(() => {
    if (identity?.profile?.displayName) return identity.profile.displayName;
    if (identity?.profile?.name) return identity.profile.name;
    if (identity?.npub) return `${identity.npub.slice(0, 8)}…`;
    return null;
  }, [identity]);

  return (
    <div className="space-y-5">
      <Card className="border-brand/70 bg-[#221832] shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
        <CardContent className="px-4 py-4">
          <h3 className="text-[17px] font-semibold text-text-near-white">{event.title}</h3>
          <p className="mt-1 text-[12px] text-text-secondary">
            {formatLongDate(new Date(event.startAt))} · {formatTimeRange(event.startAt, event.endAt)}
          </p>
          <div className="mt-3 flex items-center gap-2">
            {calendar && (
              <Badge variant={badgeVariant(calendar.color)}>{calendar.name}</Badge>
            )}
            {event.invitation && (
              <Badge variant="outline">{invitationLabel(event.invitation)}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {event.meetingLabel && (
        <section>
          <p className="text-[12px] font-semibold text-text-near-white">Video meeting</p>
          <p className="mt-1 text-[11px] text-text-secondary">{event.meetingLabel}</p>
          <Button size="lg" className="mt-3 w-full" onClick={() => toast.info("Meeting link not available")}>
            Join meeting
          </Button>
        </section>
      )}

      <Separator />

      <section>
        <p className="text-[12px] font-semibold text-text-near-white">Guests</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <GuestsRow guests={guests} size={26} />
          {guests.length > 0 && (
            <p className="text-right text-[11px] text-text-tertiary">
              {guests.length} invited · {guests.filter((g) => g.accepted).length} accepted
            </p>
          )}
        </div>
      </section>

      <Separator />

      <section>
        <p className="text-[12px] font-semibold text-text-near-white">Invitation</p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="secondary" onClick={onAccept}>Accept</Button>
          <Button size="sm" variant="outline" className="text-warn" onClick={onMaybe}>Maybe</Button>
          <Button size="sm" variant="destructive" onClick={onDecline}>Decline</Button>
        </div>
      </section>

      <Separator />

      <section>
        <p className="text-[12px] font-semibold text-text-near-white">Description</p>
        <p className="mt-2 text-[12px] leading-6 text-text-secondary">
          {event.description ?? "No description added."}
        </p>
      </section>

      <Separator />

      <section>
        <p className="text-[12px] font-semibold text-text-near-white">Nostr delivery</p>
        <div className="mt-2 flex items-center gap-2 text-[12px] text-text-secondary">
          <span className="h-2 w-2 rounded-full bg-ok" />
          <span>{event.syncStatus ?? "Pending publication"}</span>
        </div>
        {signerName && (
          <p className="mt-3 text-[11px] text-text-tertiary">Signed by {signerName}</p>
        )}
        <p className="mt-1 text-[11px] text-text-tertiary">Event ID {event.id}</p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link href={`/calendar/new?edit=${event.id}`} className="no-underline">
          <Button variant="outline" size="lg" className="w-full">
            Edit event
          </Button>
        </Link>
        <Button variant="outline" size="lg" onClick={() => toast.info("Messaging guests coming soon")}>
          Message guests
        </Button>
      </div>

      {onDelete && (
        <Button variant="destructive" size="sm" className="w-full" onClick={onDelete}>
          Delete event
        </Button>
      )}

      {(event.attachedNote || event.noteTitle) && (
        <Card>
          <CardContent className="px-4 py-3">
            <p className="text-[11px] text-text-tertiary">Attached note</p>
            <p className="mt-1 text-[12px] font-medium text-brand-light">
              {event.attachedNote ?? event.noteTitle}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
