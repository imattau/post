# UI Drift Fix Plan — Figma vs. Current Code

**Figma**: Nostr Suite - N Mail Mock-up (`m80KkhYC8cm62puZuqW1C9`)
**Branch**: Current state

---

## Priority Legend

| Tag | Meaning |
|-----|---------|
| P0 | Breaking / visually wrong |
| P1 | Notable drift from design |
| P2 | Polish / minor detail |

---

## P0 — High Priority

### 1. Message rows: cards vs. flat list rows

**Problem**: Figma shows each message as an individual rounded card (`424×104px`, `bg-sidebar`, `border border-border`, `rounded-pill`, 16px inner padding). Current code renders simple `<div>` rows with `border-b` dividers — no card container.

**Files**: `components/MessageRow.tsx`, `app/(suite)/mail/_components/MessageListView.tsx`

**Fix** — `MessageRow.tsx`:
```tsx
// Replace the outer div
<div
  onClick={onClick}
  className={`flex gap-3 px-4 py-4 mx-5 my-1 border border-border rounded-pill bg-sidebar cursor-pointer transition-all duration-150 ${
    selected
      ? "ring-1 ring-brand"
      : "hover:bg-sidebar/80"
  }`}
>
```
- Remove `border-l-[3px] border-brand` from selected
- Add `ring-1 ring-brand` for selected (creates a unified card outline instead of a left bar)
- Add horizontal margin `mx-5` to match Figma's 332px card inset within the 448px panel
- Container card layout: padding = 16px (avatar at x=16 from card edge matches Figma where avatar is at x=348 from panel edge = 348-332=16)

**Fix** — `MessageListView.tsx`:
- Remove the `border-b border-border` that was on the container
- Remove the `[&::-webkit-scrollbar]:hidden` from the filter row

---

### 2. Missing unread / draft counts in sidebar nav

**Problem**: Figma shows `12` next to Inbox (brand-light, right-aligned) and `3` next to Drafts (text-secondary). Code uses `count: null` for all nav items.

**Files**: `app/(suite)/mail/_components/MailContent.tsx`

**Fix** — Wire in the mailbox store counts:

```tsx
// At top of MailContent, add store subscriptions
const unreadCounts = useMailboxStore((s) => s.unreadCounts);

// In the nav items array, replace `count: null` with:
{ icon: "▣", label: "Inbox", count: unreadCounts.inbox, href: "/mail/inbox" },
{ icon: "▤", label: "Drafts", count: unreadCounts.drafts, href: "/mail/drafts" },

// In the rendering, render count when non-null:
{count != null && (
  <span className="text-brand-light text-[11px] font-semibold">{count}</span>
)}
```

---

### 3. Active Inbox icon color should be brand-light

**Problem**: Figma shows the `▣` icon in brand-light (`#A78BFA`) when Inbox is active, with the label text in white. Code uses unified `text-white` for both icon and label on the active item.

**File**: `app/(suite)/mail/_components/MailContent.tsx`

**Fix** — Split icon/label color classes:
```tsx
<span className={`text-[15px] ${isActive ? "text-brand-light" : ""}`}>{item.icon}</span>
<span className={`flex-1 text-[13px] ${isActive ? "font-semibold text-white" : "font-medium text-text-secondary"}`}>
  {item.label}
</span>
```

---

### 4. Compose button: wrong width and font-size

**Problem**: Figma button is `200px` wide, text is 14px Semi Bold. Code uses `w-full` (full 216px sidebar width) and `text-[13px] font-semibold`.

**File**: `app/(suite)/mail/_components/MailContent.tsx`

**Fix**:
```tsx
<a
  href="/mail/inbox?compose=true"
  className="w-[200px] h-12 bg-brand rounded-pill flex items-center gap-2 justify-center no-underline hover:brightness-110 active:scale-[0.97] transition-all duration-150"
>
  <span className="text-white text-[15px]">＋</span>
  <span className="text-white text-[14px] font-semibold">Compose</span>
</a>
```

---

## P1 — Medium Priority

### 5. Network card: progress bar dimensions wrong

**Problem**: Figma progress bar is `184px` wide, `6px` tall, `rounded` (3px). Code uses `w-full` and `h-[3px]`.

**File**: `app/(suite)/mail/_components/MailContent.tsx`

**Fix**:
```tsx
<div className="w-[184px] h-[6px] bg-pill-subtle rounded-progress mt-1">
  <div className="h-full bg-ok rounded-progress" style={{ width: `${healthPercent}%` }} />
</div>
```

---

### 6. Message row label pills: wrong height

**Problem**: Figma label pills in message cards are `28px` tall. Code uses `h-[22px]`.

**File**: `components/MessageRow.tsx`

**Fix**:
```tsx
<span className="h-[28px] px-3 rounded-pill bg-pill-subtle text-text-secondary text-[10px] font-medium leading-[28px]">
  {label}
</span>
```

---

### 7. Search bar: width not constrained

**Problem**: Figma search bar is `400px` wide. Code stretches full width of the 448px panel.

**File**: `app/(suite)/mail/_components/MessageListView.tsx`

**Fix**:
```tsx
<div className="flex items-center gap-2 h-[42px] px-3 bg-sidebar border border-border rounded-pill max-w-[400px]">
```

---

### 8. Filter chips: height off by 2px

**Problem**: Figma shows `28px` tall chips. Code uses `h-[30px]`.

**File**: `app/(suite)/mail/_components/MessageListView.tsx`

**Fix**:
```tsx
className={`h-[28px] px-3 rounded-pill text-[12px] font-medium border transition-all duration-150 cursor-pointer whitespace-nowrap ...`}
```

---

### 9. Inactive dock tiles: Bold vs Semi Bold

**Problem**: Figma tiles uses `fontWeight: 600` (Semi Bold). Code uses `font-bold` (700).

**File**: `components/IconDock.tsx`

**Fix**: Change all `font-bold` on dock tile letters to `font-semibold`.

---

### 10. Unread indicator in message rows: too subtle

**Problem**: Figma shows a clear unread badge (bold sender name + prominent dot). Code uses a tiny `7px` dot.

**File**: `components/MessageRow.tsx`

**Fix**:
```tsx
{!message.read && <div className="w-[9px] h-[9px] rounded-full bg-brand-light flex-shrink-0" />}
```
Increase from `7px` to `9px` for better visibility.

---

### 11. Label dot size in sidebar

**Problem**: Figma uses the `●` text character at 12px font size (~9-10px rendered). Code uses `w-2 h-2` (8px) circle.

**File**: `app/(suite)/mail/_components/MailContent.tsx`

**Fix**:
```tsx
<span className="w-[10px] h-[10px] rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
```

---

### 12. Reply composer: width not constrained

**Problem**: Figma shows `560px` wide reply area. Code uses `mx-5` (flexible).

**File**: `components/ReplyComposer.tsx`

**Fix**:
```tsx
<div className="mx-5 mb-5 mt-2 h-[130px] max-w-[560px] border border-border rounded-pill bg-sidebar flex flex-col">
```

---

## P2 — Polish / Low Priority

### 13. Mock data names don't match Figma examples

**File**: `lib/mock/threads.ts`

**Fix**: Update display names to match Figma:
- `Alice` → `Alice Nguyen`
- Keep others consistent or add full names where Figma shows them

### 14. Hover brightness on sidebar label "+" button

**File**: `app/(suite)/mail/_components/MailContent.tsx`

**Fix**: Already has `hover:text-text-secondary` — add `hover:brightness-110`.

### 15. Filter chip active state background

**File**: `app/(suite)/mail/_components/MessageListView.tsx`

**Note**: Already uses `bg-surface-active border border-brand text-brand-light` ✅. No change needed.

### 16. AppSwitcher positioning

**File**: `components/AppSwitcher.tsx`

**Note**: Positioned at `top: 74, left: 1112`. Verify against Figma when screen opens — may need fine-tuning.

### 17. Compose modal: verify border radius

**File**: `components/ComposeModal.tsx`

**Note**: Outer `rounded-[24px]`, inner `rounded-[20px]`, bg `bg-modal-card`, border `border-modal-stroke`. Matches Figma spec. ✅

### 18. Scrollbar styling consistency

**File**: Consider adding consistent scrollbar styling (`[&::-webkit-scrollbar]:hidden` or custom thin scrollbar) across all scrollable panels.

---

## Implementation Order

| Order | Item | Effort |
|-------|------|--------|
| 1 | P0-1: Message row cards | Medium |
| 2 | P0-2: Unread counts in sidebar | Small |
| 3 | P0-3: Active icon color | Small |
| 4 | P0-4: Compose button | Small |
| 5 | P1-5: Progress bar | Trivial |
| 6 | P1-6: Label pill height | Trivial |
| 7 | P1-7: Search bar width | Trivial |
| 8 | P1-8: Filter chip height | Trivial |
| 9 | P1-9: Dock tile font-weight | Trivial |
| 10 | P1-10: Unread dot size | Trivial |
| 11 | P1-11: Label dot size | Trivial |
| 12 | P1-12: Reply composer width | Trivial |
| 13 | P2-13: Mock names | Small |
| 14 | P2-14: Hover polish | Trivial |
| 15 | P2-16: AppSwitcher position | Verify only |
| 16 | P2-18: Scrollbar consistency | Small |

---

## Verification

After each change:
```bash
pnpm typecheck   # TypeScript check
pnpm lint        # Next.js lint
pnpm test        # Unit tests
```

Run `pnpm dev` and visually compare against Figma using dimensions overlay or screenshots.
