# Calendar Library Migration Plan

## Dependencies Installed

```json
"date-fns": "^4.4.0",
"react-day-picker": "^10.0.1",
"react-hook-form": "^7.80.0",
"@hookform/resolvers": "^5.4.0",
"zod": "^4.4.3",
```

shadcn/ui initialized (base-nova style, Base UI primitives, Tailwind v4).

---

## Step 1: Fix `globals.css` — Map shadcn CSS variables to app tokens

**File:** `app/globals.css`

Replace the shadcn `:root` and `.dark` blocks with the app's own dark-only color tokens:

```css
:root {
  --background: #0B0D12;
  --foreground: #FFFFFF;
  --card: #10151D;
  --card-foreground: #F3F5F7;
  --popover: #11151D;
  --popover-foreground: #F3F5F7;
  --primary: #8B5CF6;
  --primary-foreground: #FFFFFF;
  --secondary: #2B2146;
  --secondary-foreground: #A78BFA;
  --muted: #1B202B;
  --muted-foreground: #949BAA;
  --accent: #2B2146;
  --accent-foreground: #F3F5F7;
  --destructive: #FB7185;
  --border: #272D3A;
  --input: #272D3A;
  --ring: #8B5CF6;
  --radius: 14px;
  --chart-1: #8B5CF6;
  --chart-2: #60A5FA;
  --chart-3: #34D399;
  --chart-4: #FBBF24;
  --chart-5: #FB7185;
  --sidebar: #11151D;
  --sidebar-foreground: #949BAA;
  --sidebar-primary: #8B5CF6;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #2B2146;
  --sidebar-accent-foreground: #F3F5F7;
  --sidebar-border: #272D3A;
  --sidebar-ring: #8B5CF6;
}
```

Remove the `@layer base` block body default — app body styling is already in `html, body`.

Change the `@layer base` html rule — remove `@apply font-sans` since the app uses `--font-inter`.

---

## Step 2: Add remaining shadcn/ui components

```bash
npx shadcn@latest add card badge input textarea separator tabs select
```

---

## Step 3: Phase 1 — Replace `lib/calendar.ts` with date-fns

**File:** `lib/calendar.ts`

Replace all custom functions with date-fns imports:

```ts
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, differenceInCalendarDays, format } from "date-fns";
import type { CalendarEvent } from "@/lib/types";

export function buildMonthGrid(month: Date): Date[][] {
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const gridStart = startOfWeek(first, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(addDays(last, 6), { weekStartsOn: 1 });
  const weeks: Date[][] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function monthLabel(date: Date): string {
  return format(date, "MMMM yyyy");
}

export function shortMonthLabel(date: Date): string {
  return format(date, "MMM d");
}

export function weekdayLabel(date: Date): string {
  return format(date, "EEE");
}

export function formatTimeRange(startAt: number, endAt: number): string {
  return `${format(startAt, "h:mm a")} to ${format(endAt, "h:mm a")}`;
}

export function formatMonthDay(date: Date): string {
  return format(date, "MMM d");
}

export function formatLongDate(date: Date): string {
  return format(date, "EEEE, MMMM d");
}

export function getEventSpanDays(event: Pick<CalendarEvent, "startAt" | "endAt">): number {
  return Math.max(1, differenceInCalendarDays(event.endAt, event.startAt) + 1);
}

export { startOfMonth, endOfMonth, startOfWeek, addDays, isSameDay, isSameMonth, differenceInCalendarDays };
```

Update imports in:
- `app/(suite)/calendar/_components/CalendarWorkspace.tsx`
- `app/(suite)/calendar/week/page.tsx`
- `app/(suite)/calendar/agenda/page.tsx`
- `app/(suite)/calendar/events/[eventId]/page.tsx`

---

## Step 4: Phase 2 — Refactor calendar files with shadcn components

### 4a. Fix the generated Button component to use app radii

**File:** `components/ui/button.tsx`

Change `rounded-lg` to `rounded-[var(--radius-pill)]` for the base class, and adjust sizes to match app's `h-9`, `h-10` patterns:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors ... rounded-[var(--radius-pill)] ...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:brightness-110",
        outline: "border border-border bg-pill-subtle text-text-secondary hover:bg-surface-active hover:text-text-near-white",
        secondary: "bg-surface-active text-brand-light border border-brand/70",
        ghost: "text-text-tertiary hover:text-text-near-white",
        destructive: "bg-danger/10 text-danger hover:bg-danger/20",
      },
      size: {
        default: "h-9 px-4 text-[12px]",
        sm: "h-8 px-3 text-[11px]",
        lg: "h-10 px-6 text-[13px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);
```

### 4b. Refactor `CalendarViewControls.tsx`

Replace manual button/Link tab strip with shadcn Tabs + Button:

```tsx
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default function CalendarViewControls({ activeView, onToday, onPrevious, onNext }) {
  return (
    <div className="flex items-center gap-2">
      {onToday && (
        <Button variant="outline" size="sm" onClick={onToday}>
          Today
        </Button>
      )}
      <div className="flex gap-1">
        <Button variant="outline" size="icon" onClick={onPrevious} aria-label="Previous">
          ‹
        </Button>
        <Button variant="outline" size="icon" onClick={onNext} aria-label="Next">
          ›
        </Button>
      </div>
      <Tabs value={activeView}>
        <TabsList>
          <TabsTrigger value="month" asChild>
            <Link href="/calendar">Month</Link>
          </TabsTrigger>
          <TabsTrigger value="week" asChild>
            <Link href="/calendar/week">Week</Link>
          </TabsTrigger>
          <TabsTrigger value="agenda" asChild>
            <Link href="/calendar/agenda">Agenda</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Button variant="outline" size="icon" aria-label="More">
        ⋮
      </Button>
    </div>
  );
}
```

### 4c. Refactor `CalendarWorkspace.tsx`

Replace:
- `<button>` → `<Button variant="outline">`, `<Button variant="secondary">`, `<Button variant="ghost">`
- `rounded-[14px] border border-border bg-[#...]` → `<Card>`, `<CardContent>`
- `rounded-pill border px-3 py-1 text-[11px] font-medium` + `badgeTone()` → `<Badge>`
- `h-px bg-border` → `<Separator>`
- `rounded-[12px] border border-border bg-[#11151D] px-4 py-3` → `<Card>`

### 4d. Refactor `new/page.tsx`

Replace `<input>` → `<Input>`, `<textarea>` → `<Textarea>`, buttons → `<Button>`.

### 4e. Refactor `week/page.tsx`, `agenda/page.tsx`, `events/[eventId]/page.tsx`

Same pattern — replace manual element patterns with shadcn components.

### 4f. `CalendarSidebar.tsx`

Replace buttons/Link with Button component.

---

## Step 5: Phase 3a — Replace `CalendarMiniGrid` with react-day-picker

**File:** `app/(suite)/calendar/_components/CalendarWorkspace.tsx`

Replace the `CalendarMiniGrid` component (lines 56-114):

```tsx
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";

function CalendarMiniGrid({ activeMonth, selectedDate, onPickMonth, onPickDate }) {
  return (
    <div className="rounded-[10px]">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-text-near-white">
          {format(activeMonth, "MMMM yyyy")}
        </p>
      </div>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && onPickDate(date)}
        month={activeMonth}
        onMonthChange={onPickMonth}
        showOutsideDays={false}
        className="text-[10px]"
        classNames={{
          months: "flex flex-col",
          month: "space-y-2",
          caption: "hidden",
          table: "w-full border-collapse",
          head_row: "grid grid-cols-7",
          head_cell: "text-center text-[10px] text-text-tertiary",
          row: "grid grid-cols-7",
          cell: "text-center p-0 text-[10px]",
          day: "mx-auto flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-text-secondary hover:bg-surface-active hover:text-text-near-white transition-colors",
          day_selected: "bg-brand text-white hover:bg-brand",
          day_today: "font-bold text-brand-light",
          day_outside: "opacity-40",
        }}
      />
    </div>
  );
}
```

---

## Step 6: Phase 3b — Refactor `new/page.tsx` with react-hook-form + zod

Replace 8 `useState` calls with RHF + Zod validation:

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4"; // v4 import path
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  calendarId: z.string(),
  guestQuery: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
});

export default function CalendarNewEventPage() {
  const router = useRouter();
  const { createEvent, load } = useCalendarStore();
  const form = useForm({ resolver: zodResolver(formSchema), defaultValues: { ... } });
  const { register, handleSubmit, watch, setValue } = form;
  // ... same structure but using form.register, form.handleSubmit etc.
}
```

---

## Summary of Files to Touch

| File | Change |
|------|--------|
| `app/globals.css` | Replace shadcn variables with app design tokens |
| `lib/calendar.ts` | Rewrite with date-fns |
| `lib/utils.ts` | Already created by shadcn init, keep as-is |
| `components/ui/button.tsx` | Customize radii, colors, sizes to app design |
| `components/ui/card.tsx` | Generate + customize |
| `components/ui/badge.tsx` | Generate + customize with brand/info/ok/warn/danger variants |
| `components/ui/input.tsx` | Generate + customize |
| `components/ui/textarea.tsx` | Generate + customize |
| `components/ui/separator.tsx` | Generate + customize |
| `components/ui/tabs.tsx` | Generate + customize |
| `components/ui/select.tsx` | Generate + customize |
| `app/(suite)/calendar/_components/CalendarWorkspace.tsx` | Major refactor — shadcn components + DayPicker |
| `app/(suite)/calendar/_components/CalendarViewControls.tsx` | Replace with Tabs + Button |
| `app/(suite)/calendar/_components/CalendarSidebar.tsx` | Replace buttons with Button |
| `app/(suite)/calendar/new/page.tsx` | Full refactor — RHF + Zod + shadcn inputs |
| `app/(suite)/calendar/week/page.tsx` | Replace buttons/links with shadcn |
| `app/(suite)/calendar/agenda/page.tsx` | Replace buttons/links with shadcn |
| `app/(suite)/calendar/events/[eventId]/page.tsx` | Replace buttons/badges with shadcn |
