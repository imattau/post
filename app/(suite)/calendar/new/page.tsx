"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { monthLabel } from "@/lib/calendar";
import { useCalendarStore } from "@/lib/stores/calendar";
import CalendarPageFrame from "../_components/CalendarPageFrame";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  calendarId: z.string(),
  guestQuery: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  private: z.boolean().optional(),
  notifyGuests: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function CalendarNewEventPage() {
  const router = useRouter();
  const calendars = useCalendarStore((s) => s.calendars);
  const createEvent = useCalendarStore((s) => s.createEvent);
  const activeMonth = useCalendarStore((s) => s.activeMonth);
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const load = useCalendarStore((s) => s.load);
  const [privateEvent, setPrivateEvent] = useState(false);
  const [notifyGuests, setNotifyGuests] = useState(false);

  const defaultDate = useMemo(() => {
    const d = selectedDate ?? new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, [selectedDate]);

  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      date: defaultDate,
      startTime: "10:00",
      endTime: "11:30",
      calendarId: "work",
      guestQuery: "",
      location: "",
      description: "",
      private: false,
      notifyGuests: false,
    },
  });

  const calendarId = watch("calendarId");

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(data: FormData) {
    const [y, m, d] = data.date.split("-").map(Number);
    const [startHour, startMinute] = data.startTime.split(":").map(Number);
    const [endHour, endMinute] = data.endTime.split(":").map(Number);
    const startAt = new Date(y, m - 1, d, startHour, startMinute).getTime();
    const endAt = new Date(y, m - 1, d, endHour, endMinute).getTime();
    const created = await createEvent({
      title: data.title,
      startAt,
      endAt,
      description: data.description ?? "",
      location: data.location ?? "",
      meetingLabel: data.location ? `Meeting: ${data.location}` : undefined,
    }, data.calendarId);
    router.push(`/calendar/events/${created.id}`);
  }

  return (
    <CalendarPageFrame
      activeNav="month"
      title="New event"
      subtitle="Create a private or shared Nostr calendar event."
      headerActions={
        <div className="rounded-pill border border-border bg-pill-subtle px-4 py-2 text-[12px] text-text-secondary">
          {activeMonth ? monthLabel(activeMonth) : "Select a month"}
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mx-auto mt-5 max-w-[720px] rounded-[18px] border border-border bg-[#151A23] px-6 py-6 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
          <div className="flex items-start justify-between">
            <h3 className="text-[19px] font-semibold text-text-near-white">New event</h3>
            <button type="button" className="text-[18px] leading-none text-text-tertiary hover:text-text-near-white">
              ×
            </button>
          </div>

          <div className="mt-5 space-y-5">
            <label className="block">
              <span className="text-[11px] text-text-secondary">Title</span>
              <Input
                {...register("title")}
                className="mt-2"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-[11px] text-text-secondary">Date and time</span>
                <Input
                  value={`${watch("date")} · ${watch("startTime")}`}
                  readOnly
                  className="mt-2"
                />
              </label>
              <label className="block">
                <span className="text-[11px] text-transparent">End time</span>
                <Input
                  {...register("endTime")}
                  className="mt-2"
                />
              </label>
            </div>

            <div>
              <p className="text-[11px] text-text-secondary">Calendar</p>
              <div className="mt-2 flex gap-2">
                {calendars.filter((item) => item.id !== "public").map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setValue("calendarId", item.id)}
                    className={`rounded-pill border px-3 py-1 text-[11px] font-medium ${
                      calendarId === item.id
                        ? "border border-brand/70 bg-surface-active text-brand-light"
                        : "border-border bg-pill-subtle text-text-secondary"
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-[11px] text-text-secondary">Guests</span>
              <div className="mt-2 flex h-12 items-center gap-3 rounded-[12px] border border-border bg-[#11151D] px-3">
                <input
                  {...register("guestQuery")}
                  placeholder="Add people or npubs (coming soon)"
                  className="flex-1 bg-transparent text-[13px] text-text-secondary outline-none placeholder:text-text-placeholder"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[11px] text-text-secondary">Location or link</span>
              <Input
                {...register("location")}
                placeholder="Add location, call or Nostr room"
                className="mt-2"
              />
            </label>

            <label className="block">
              <span className="text-[11px] text-text-secondary">Description</span>
              <Textarea
                {...register("description")}
                placeholder="Add agenda or notes..."
                className="mt-2"
              />
            </label>

            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={privateEvent ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setPrivateEvent(!privateEvent)}
                >
                  {privateEvent ? "✓ " : ""}Private
                </Button>
                <Button
                  type="button"
                  variant={notifyGuests ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setNotifyGuests(!notifyGuests)}
                >
                  {notifyGuests ? "✓ " : ""}Notify guests
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/calendar/agenda")}
                >
                  Cancel
                </Button>
                <Button type="submit" size="lg">
                  Create
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </CalendarPageFrame>
  );
}
