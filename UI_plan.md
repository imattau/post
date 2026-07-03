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
| [NEW] | Item found in systematic review |
| [FIXED] | Already addressed in code |

---

## P0 — High Priority

### 1. Message rows: cards vs. flat list rows [FIXED]

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

### 2. Missing unread / draft counts in sidebar nav [FIXED]

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

### 3. Active Inbox icon color should be brand-light [FIXED]

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

### 4. Compose button: wrong width and font-size [FIXED width, font-weight; NEW remaining issues]

**Problem**: Figma button is `200px` wide, `＋` is 21px Medium, "Compose" is 14px Semi Bold. Code width and "Compose" weight are fixed, but `＋` is 15px instead of 21px.

**File**: `app/(suite)/mail/_components/MailContent.tsx`

**Fix**:
```tsx
// Change ＋ from text-[15px] to:
<span className="text-white text-[21px] font-medium">＋</span>
```

---

### 5. [NEW] Icon dock tile text: 17px instead of 14px

**Problem**: Figma shows all dock tile letters at 14px Semi Bold (600). The active "M" tile uses 17px Bold (700). Inactive D/C/N/P tiles use 17px Semi Bold. Search ⌕ and Help ? use 15px.

**File**: `components/IconDock.tsx`

**Fix**:
```diff
// Active M tile (line 47):
- <span className="text-brand-light text-[17px] font-bold">M</span>
+ <span className="text-brand-light text-[14px] font-semibold">M</span>

// Inactive D/C/N/P tiles (line 57):
- <span className="text-text-secondary text-[17px] font-semibold">{tile.letter}</span>
+ <span className="text-text-secondary text-[14px] font-semibold">{tile.letter}</span>

// Search ⌕ (line 66):
- <span className="text-text-secondary text-[15px]">⌕</span>
+ <span className="text-text-secondary text-[14px] font-semibold">⌕</span>

// Help ? (line 71):
- <span className="text-text-secondary text-[15px] font-semibold">?</span>
+ <span className="text-text-secondary text-[14px] font-semibold">?</span>
```

---

### 6. [NEW] Sidebar horizontal inset: 16px instead of 24px

**Problem**: Figma places branding text and compose button at x=96 (24px from sidebar edge at x=72). Code uses `px-4` = 16px. Nav icons at x=104 (32px from edge) but code's `px-4 + px-3` on links = 16+12=28px.

**File**: `app/(suite)/mail/_components/MailContent.tsx`

**Fix**:
```diff
// Sidebar container (line 93):
- <div className="bg-sidebar flex flex-col px-4 pt-[25px] pb-4 gap-1 overflow-y-auto">
+ <div className="bg-sidebar flex flex-col pl-6 pr-4 pt-[25px] pb-4 gap-1 overflow-y-auto">

// Nav links — add pl-2 to inner items (line 122):
- className={`flex items-center gap-3 h-[38px] px-3 rounded-[10px] ...
+ className={`flex items-center gap-3 h-[38px] pl-5 pr-3 rounded-[10px] ...
```
This gives: 24px (pl-6) + 8px (pl-5 inner) = 32px for nav icon position. Matching Figma's x=104.

---

### 7. [NEW] Message time: wrong color and weight for unread state

**Problem**: Figma shows unread message timestamps in Semi Bold 11 white (`#FFFFFF`). Code uses `text-text-tertiary` (`#6F7787`) for ALL messages regardless of read state.

**File**: `components/MessageRow.tsx`

**Fix**:
```diff
- <span className="ml-auto text-[11px] flex-shrink-0 text-text-tertiary">
+ <span className={`ml-auto text-[11px] flex-shrink-0 ${!message.read ? "font-semibold text-white" : "text-text-tertiary"}`}>
```

---

## P1 — Medium Priority

### 8. Network card: progress bar dimensions wrong [FIXED]

**Problem**: Figma progress bar is `184px` wide, `6px` tall, `rounded` (3px). Code uses `w-full` and `h-[3px]`.

**File**: `app/(suite)/mail/_components/MailContent.tsx`

**Fix**:
```tsx
<div className="w-[184px] h-[6px] bg-pill-subtle rounded-progress mt-1">
  <div className="h-full bg-ok rounded-progress" style={{ width: `${healthPercent}%` }} />
</div>
```

---

### 9. Message row label pills: wrong height [FIXED]

**Problem**: Figma label pills in message cards are `28px` tall. Code uses `h-[22px]`.

**File**: `components/MessageRow.tsx`

**Fix**:
```tsx
<span className="h-[28px] px-3 rounded-pill bg-pill-subtle text-text-secondary text-[10px] font-medium leading-[28px]">
  {label}
</span>
```

---

### 10. Search bar: width not constrained [FIXED]

**Problem**: Figma search bar is `400px` wide. Code stretches full width of the 448px panel.

**File**: `app/(suite)/mail/_components/MessageListView.tsx`

**Fix**:
```tsx
<div className="flex items-center gap-2 h-[42px] px-3 bg-sidebar border border-border rounded-pill max-w-[400px]">
```

---

### 11. Filter chips: height off by 2px [FIXED]

**Problem**: Figma shows `28px` tall chips. Code uses `h-[30px]`.

**File**: `app/(suite)/mail/_components/MessageListView.tsx`

**Fix**:
```tsx
className={`h-[28px] px-3 rounded-pill text-[12px] font-medium border transition-all duration-150 cursor-pointer whitespace-nowrap ...`}
```

---

### 12. Inactive dock tiles: Bold vs Semi Bold [FIXED]

**Problem**: Figma tiles uses `fontWeight: 600` (Semi Bold). Code uses `font-bold` (700).

**File**: `components/IconDock.tsx`

**Fix**: Change all `font-bold` on dock tile letters to `font-semibold`.

Note: The active "M" tile still has `font-bold` — see P0 item #5 above for the combined fix.

---

### 13. Unread indicator in message rows: too subtle [INTENTIONAL 9px]

**Problem**: Figma shows a 7×7 `#A78BFA` dot. Code now uses 9px (intentionally increased for visibility).

**File**: `components/MessageRow.tsx`

**Status**: Deliberate deviation. 9px is preferred for accessibility but 7px would match Figma exactly.

---

### 14. Label dot size in sidebar [FIXED]

**Problem**: Figma uses the `●` text character at 12px font size (~9-10px rendered). Code uses `w-2 h-2` (8px) circle.

**File**: `app/(suite)/mail/_components/MailContent.tsx`

**Fix**:
```tsx
<span className="w-[10px] h-[10px] rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
```

---

### 15. Reply composer: width not constrained [FIXED]

**Problem**: Figma shows `560px` wide reply area. Code uses `mx-5` (flexible).

**File**: `components/ReplyComposer.tsx`

**Fix**:
```tsx
<div className="mx-5 mb-5 mt-2 h-[130px] max-w-[560px] border border-border rounded-pill bg-sidebar flex flex-col">
```

---

### 16. [NEW] Reply Composer Send button: wrong height and missing width

**Problem**: Figma Send button is 90×34px, radius 10. Code uses `h-8` (32px) and `px-4` (no fixed width).

**File**: `components/ReplyComposer.tsx`

**Fix**:
```diff
- <button className="h-8 px-4 rounded-[10px] bg-brand text-white text-[12px] font-semibold ...">
+ <button className="h-[34px] w-[90px] rounded-[10px] bg-brand text-white text-[12px] font-semibold ...">
```

---

### 17. [NEW] AttachmentCard: border radius 14px instead of 12px

**Problem**: Figma specifies `borderRadius: 12px` for attachment cards. Code uses `rounded-pill` (14px).

**File**: `components/AttachmentCard.tsx`

**Fix**:
```diff
- <div className="flex items-center gap-3 h-[88px] px-3 border border-border rounded-pill bg-sidebar w-[274px]">
+ <div className="flex items-center gap-3 h-[88px] px-3 border border-border rounded-[12px] bg-sidebar w-[274px]">
```

---

### 18. [NEW] Compose Modal: format toolbar Bold button uses 700 instead of 600

**Problem**: Figma shows format toolbar glyphs at Semi Bold 600. Code uses `font-bold` (700) for the B button.

**File**: `components/ComposeModal.tsx`

**Fix**:
```diff
- <button ... className="... text-[13px] font-bold ...">B</button>
+ <button ... className="... text-[13px] font-semibold ...">B</button>
```

---

### 19. [NEW] Compose Modal: Send button left-radius 14px instead of 12px

**Problem**: Figma spec says Send button radius 12px. Code uses `rounded-l-pill` which resolves to 14px via `--radius-pill`.

**File**: `components/ComposeModal.tsx`

**Fix**:
```diff
- className="h-10 px-5 rounded-l-pill bg-brand text-white ..."
+ className="h-10 px-5 rounded-l-[12px] bg-brand text-white ..."
```

And the dropdown button:
```diff
- className="h-10 w-[34px] rounded-r-pill bg-brand ..."
+ className="h-10 w-[34px] rounded-r-[12px] bg-brand ..."
```

---

### 20. [NEW] UploadProgress: file row cards use 14px radius instead of 12px

**Problem**: Figma file progress rows have radius 12px. Code uses `rounded-pill` (14px).

**File**: `components/UploadProgress.tsx`

**Fix**:
```diff
- className="flex items-center gap-3 h-15 px-3 border border-border rounded-pill bg-sidebar"
+ className="flex items-center gap-3 h-15 px-3 border border-border rounded-[12px] bg-sidebar"
```

---

### 21. [NEW] UploadProgress: missing panel height

**Problem**: Figma upload overlay panel has explicit `height: 340px`. Code only sets width (500px), relying on content flow which won't match the fixed layout specs.

**File**: `components/UploadProgress.tsx`

**Fix**:
```diff
- style={{ width: 500, left: 886, top: 594 }}
+ style={{ width: 500, height: 340, left: 886, top: 594 }}
```

---

### 22. [NEW] Settings & Contacts: tab pill height 38px instead of 40px

**Problem**: PLAN.md §15.2 specifies "216×40 pill" for settings tabs. Code uses `h-[38px]` (same as mailbox rows which are 38px per Figma). Contacts sidebar tabs have the same issue.

**Files**: `app/(suite)/settings/page.tsx`, `app/(suite)/contacts/page.tsx`

**Fix**:
```diff
// In both files, change tab button height:
- className={`flex items-center gap-3 h-[38px] px-3 rounded-[10px] ...
+ className={`flex items-center gap-3 h-10 px-3 rounded-[10px] ...
```

---

### 23. [NEW] Settings Identity tab: avatar initials font-weight wrong

**Problem**: Figma shows Semi Bold 25 (600) for identity avatar initials. Code uses `font-bold` (700).

**File**: `app/(suite)/settings/page.tsx`

**Fix**:
```diff
- <span className="text-white text-[25px] font-bold">AL</span>
+ <span className="text-white text-[25px] font-semibold">AL</span>
```

---

### 24. [NEW] Contacts: stat cards layout drifts from Figma

**Problem**: Figma shows one cohesive 744×132 card with 4 stat sections inside. Code renders 4 individual grid cards.

**File**: `app/(suite)/contacts/page.tsx`

**Fix**: Replace the grid of 4 individual cards with a single card containing inline stat sections:
```tsx
<div className="border border-border rounded-pill bg-sidebar p-6 flex justify-around mb-8">
  {STATS.map((stat) => (
    <div key={stat.label} className="text-center">
      <p className="text-[28px] font-semibold text-text-primary">{stat.value}</p>
      <p className="text-[11px] text-text-tertiary mt-1">{stat.label}</p>
    </div>
  ))}
</div>
```

---

### 25. [NEW] Contacts: stat value font-weight should be Semi Bold, not Bold

**Problem**: Figma shows Semi Bold 28 (600) for stat values. Code uses `font-bold` (700).

**File**: `app/(suite)/contacts/page.tsx`

**Fix** (combined with #24 above):
```diff
- <p className="text-[28px] font-bold text-text-primary">{stat.value}</p>
+ <p className="text-[28px] font-semibold text-text-primary">{stat.value}</p>
```

---

### 26. [NEW] ReadingPane: subject line 25px instead of 26px

**Problem**: Figma text style `style_0dc1a66d` has `fontSize: 26`. Code uses `text-[25px]`.

**File**: `components/ReadingPane.tsx`

**Fix**:
```diff
- <h1 className="text-[25px] font-semibold text-text-primary leading-tight">
+ <h1 className="text-[26px] font-semibold text-text-primary leading-tight">
```

---

### 27. [NEW] Message list: search placeholder text 13px instead of 12px

**Problem**: Figma style `style_c487cf45` for the search placeholder is Regular 12. Code uses `text-[13px]`.

**File**: `app/(suite)/mail/_components/MessageListView.tsx`

**Fix**:
```diff
- className="flex-1 bg-transparent border-none outline-none text-[13px] text-text-primary placeholder-text-placeholder"
+ className="flex-1 bg-transparent border-none outline-none text-[12px] text-text-primary placeholder-text-placeholder"
```

---

## P2 — Polish / Low Priority

### 28. Mock data names don't match Figma examples

**File**: `lib/mock/threads.ts`

**Fix**: Update display names to match Figma:
- `Alice` → avatarInitials `"A"` → `"AL"` (Figma shows "AL" initials)
- `Jonas` → `"Jonas Berg"` (Figma sender list)
- Keep others consistent or add full names where Figma shows them

---

### 29. Hover brightness on sidebar label "+" button [FIXED]

**File**: `app/(suite)/mail/_components/MailContent.tsx`

**Fix**: Already has `hover:text-text-secondary` — add `hover:brightness-110`.

---

### 30. Filter chip active state background [VERIFIED OK]

**File**: `app/(suite)/mail/_components/MessageListView.tsx`

**Note**: Already uses `bg-surface-active border border-brand text-brand-light`. No change needed.

---

### 31. AppSwitcher positioning [VERIFIED]

**File**: `components/AppSwitcher.tsx`

**Note**: Positioned at `top: 74, left: 1112`. Verified against Figma — matches.

---

### 32. Compose modal: verify border radius [VERIFIED OK]

**File**: `components/ComposeModal.tsx`

**Note**: Outer `rounded-[24px]`, inner `rounded-[20px]`, bg `bg-modal-card`, border `border-modal-stroke`. Matches Figma spec.

---

### 33. Scrollbar styling consistency

**File**: Consider adding consistent scrollbar styling (`[&::-webkit-scrollbar]:hidden` or custom thin scrollbar) across all scrollable panels.

---

### 34. [NEW] Network card: font sizes wrong

**Problem**: Figma "N relays connected" is Regular 12. Code uses 11px. Figma "Delivery health" is Regular 11. Code uses 10px.

**File**: `app/(suite)/mail/_components/MailContent.tsx`

**Fix**:
```diff
// "N relays connected" label (line 191):
- <span className="text-[11px] text-text-secondary">
+ <span className="text-[12px] text-text-secondary">

// "Delivery health" label (line 195):
- <p className="text-[10px] text-text-tertiary mt-1">Delivery health</p>
+ <p className="text-[11px] text-text-tertiary mt-1">Delivery health</p>
```

---

### 35. [NEW] Icon dock: hairline divider width 28px instead of 40px

**Problem**: Figma hairline between dock tiles is 40px wide. Code uses `w-[28px]`.

**File**: `components/IconDock.tsx`

**Fix**:
```diff
- <div className="mt-[18px] w-[28px] h-px bg-border" />
+ <div className="mt-[18px] w-10 h-px bg-border" />
```

---

### 36. [NEW] Icon dock: presence dot 10px instead of 8px

**Problem**: Figma presence dot is 8×8px. Code uses `w-2.5 h-2.5` (10px).

**File**: `components/IconDock.tsx`

**Fix**:
```diff
- <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-ok border-[1.5px] border-dock" />
+ <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-ok border-[1.5px] border-dock" />
```

---

### 37. [NEW] Message row: label pill font weight Regular vs Medium

**Problem**: Figma label pills use Regular 400 text. Code uses `font-medium` (500).

**File**: `components/MessageRow.tsx`

**Fix**:
```diff
- className="h-[28px] px-3 rounded-pill bg-pill-subtle text-text-secondary text-[10px] font-medium leading-[28px]"
+ className="h-[28px] px-3 rounded-pill bg-pill-subtle text-text-secondary text-[10px] leading-[28px]"
```

---

### 38. [NEW] Avatar: font-size formula not exact for all sizes

**Problem**: Avatar uses `size * 0.28` formula. At 46px this produces ~12.9px, but Figma SenderBlock avatars at 14px. At 36px it produces ~10.1px which matches Figma.

**File**: `components/Avatar.tsx`

**Fix**: Use a lookup table or more precise formula:
```tsx
const fontSizes: Record<number, number> = { 36: 10, 40: 11, 46: 14 };
const fontSize = fontSizes[size] ?? Math.round(size * 0.28);
```

---

### 39. [NEW] ReadingTopBar: action pills missing explicit 82px width

**Problem**: PLAN.md §5.3 specifies "82×36 radius 10" for Archive/Snooze/Delete pills. Code sets height (h-9 = 36px) but no width.

**File**: `components/ReadingTopBar.tsx`

**Fix**:
```diff
- className="h-9 px-3 rounded-[10px] border border-border bg-sidebar text-text-secondary text-[12px] font-medium ..."
+ className="h-9 w-[82px] rounded-[10px] border border-border bg-sidebar text-text-secondary text-[12px] font-medium ..."
```

---

### 40. [NEW] ReadingTopBar: back arrow missing font-medium

**Problem**: Figma back `←` is Medium 20. Code sets size but no weight.

**File**: `components/ReadingTopBar.tsx`

**Fix**:
```diff
- className="text-text-secondary text-[20px] cursor-pointer ..."
+ className="text-text-secondary text-[20px] font-medium cursor-pointer ..."
```

---

## Spacing & Dividers

### S1 — Icon Dock: vertical spacing is uniform but Figma varies per section [FIXED]

**Problem**: Code uses `py-3 gap-2` (12px padding, 8px uniform gap). Figma has varied spacing ranging from 10–24px between elements.

**File**: `components/IconDock.tsx`

**Fix**: Replace uniform gap with element-specific margins.

```diff
- <div className="w-[72px] h-dvh flex-shrink-0 bg-dock flex flex-col items-center py-3 gap-2">
+ <div className="w-[72px] h-dvh flex-shrink-0 bg-dock flex flex-col items-center pt-[18px]">
```

Then replace `gap-2` between elements with explicit margins:
- Logo → M: `mt-[24px]`
- Between tiles (M→D, D→C, C→N, N→P): `mt-[10px]` on each tile button
- P → hairline: `mt-[18px]`
- Hairline → Search: `mt-[19px]`
- Search → Help: `mt-[10px]`
- Help → spacer/avatar: `mt-auto` (flex-1 spacer already pushes to bottom)

---

### S2 — Sidebar: content vertical position drifts 9–13px from Figma [FIXED]

**Problem**: Branding, compose button, and nav items are all shifted higher than Figma's Y coordinates.

**File**: `app/(suite)/mail/_components/MailContent.tsx`

**Fix** — Adjust top padding and nav-item gaps:

```diff
- <div className="bg-sidebar flex flex-col p-4 gap-1 overflow-y-auto">
+ <div className="bg-sidebar flex flex-col px-4 pt-[25px] pb-4 gap-1 overflow-y-auto">
```

```diff
- gap-0.5 mt-6
+ gap-[6px] mt-6
```
(Changes row spacing from 40px to 44px to match Figma's 44px center-to-center.)

```diff
- <div className="flex items-center justify-between mt-6 mb-2 px-3">
+ <div className="flex items-center justify-between mt-[45px] mb-2 px-3">
```

---

### S3 — Compose button: icon+text left-aligned in Figma, centered in code [FIXED]

**Problem**: Figma has ＋ at 16px from button left edge and "Compose" at 52px (15px gap between them). Code uses `justify-center` which centers the pair.

**File**: `app/(suite)/mail/_components/MailContent.tsx`

**Fix**:
```diff
- className="w-[200px] h-12 bg-brand rounded-pill flex items-center gap-2 justify-center no-underline hover:brightness-110 active:scale-[0.97] transition-all duration-150"
+ className="w-[200px] h-12 bg-brand rounded-pill flex items-center gap-[15px] pl-4 no-underline hover:brightness-110 active:scale-[0.97] transition-all duration-150"
```

---

### S4 — Message list panel: all left padding should be 24px, not 20px [FIXED]

**Problem**: Figma places title/search/filters at x=344 (24px from panel edge at x=320). Code uses `px-5` (20px).

**File**: `app/(suite)/mail/_components/MessageListView.tsx`

**Fix**: Change `px-5` → `px-6` in three places:
1. Title header div (line 56)
2. Search bar container (line 63)
3. Filter chips container (line 77)

---

### S5 — Search bar border-radius: 12px per Figma, not 14px [FIXED]

**Problem**: Figma search bar has `borderRadius: 12px`. Code uses `rounded-pill` which is `--radius-pill: 14px`.

**File**: `app/(suite)/mail/_components/MessageListView.tsx`

**Fix**:
```diff
- <div className="flex items-center gap-2 h-[42px] px-3 bg-sidebar border border-border rounded-pill max-w-[400px]">
+ <div className="flex items-center gap-2 h-[42px] px-3 bg-sidebar border border-border rounded-[12px] max-w-[400px]">
```

---

### S6 — Message card horizontal margins: 12px per Figma, not 20px [FIXED]

**Problem**: Figma card spans from x=332 to x=756 (12px from each edge of the 448px panel). Code uses `mx-5` (20px).

**File**: `components/MessageRow.tsx`

**Fix**:
```diff
- className={`flex gap-3 px-4 py-4 mx-5 my-1 border border-border rounded-pill bg-sidebar cursor-pointer transition-all duration-150 ${
+ className={`flex gap-4 px-4 py-4 mx-3 my-1 border border-border rounded-pill bg-sidebar cursor-pointer transition-all duration-150 ${
```

Also changes `gap-3` (12px) to `gap-4` (16px) for the avatar-to-text gap (see S8).

---

### S7 — Gap between filter chips and first message card: needs 20px [FIXED]

**Problem**: Figma filter chips bottom at y=174 (146+28), first card at y=194 → 20px. Code has ~8px from filter row's `py-2` bottom padding.

**File**: `app/(suite)/mail/_components/MessageListView.tsx`

**Fix**: Add top padding to the message list container:
```diff
- <div className="flex-1 overflow-y-auto" role="list" aria-label="Message list">
+ <div className="flex-1 overflow-y-auto pt-3" role="list" aria-label="Message list">
```
(pt-3 = 12px additional + 8px from filter row py-2 = 20px total)

---

### S8 — Message row: avatar-to-text gap 16px per Figma, not 12px [FIXED]

**Problem**: Figma avatar at (348, 210) 40×40, text at (404, 209) → 404-348-40 = 16px. Code uses `gap-3` (12px).

**File**: `components/MessageRow.tsx`

**Fix**: Already included in S6's `gap-3` → `gap-4` change above.

---

### S9 — Message row: vertical spacing between text lines too tight [FIXED]

**Problem**: Figma sender→subject = 8px, subject→preview = 7px. Code uses `mt-0.5` (2px) for both.

**File**: `components/MessageRow.tsx`

**Fix**:
```diff
- className={`truncate text-[12px] mt-0.5 ${
+ className={`truncate text-[12px] mt-2 ${
```

```diff
- <p className="text-[11px] text-text-tertiary truncate mt-0.5">{message.preview}</p>
+ <p className="text-[11px] text-text-tertiary truncate mt-[7px]">{message.preview}</p>
```

---

### S10 — Reading pane: all side padding should be 24px, not 20px [FIXED]

**Problem**: Figma reading pane uses same 24px side padding as message list. All reading pane sub-components use `px-5` (20px) or `mx-5` (20px).

**Files**: Multiple reading pane components.

**Fixes**:
- `components/ReadingTopBar.tsx`: `px-5` → `px-6`
- `components/ReadingPane.tsx`: subject `px-5` → `px-6`
- `components/SubjectPills.tsx`: `px-5` → `px-6`
- `components/SenderBlock.tsx`: `px-5` → `px-6`
- `components/MessageBody.tsx`: `px-5` → `px-6`
- `components/AttachmentCard.tsx`: parent container `px-5` → `px-6`
- `components/ReplyComposer.tsx`: `mx-5` → `mx-6`

---

### S11 — Network card: inner padding 16px per Figma, not 12px [FIXED]

**Problem**: Figma places content at x=104 (16px from card edge at x=88). Code uses `p-3` (12px).

**File**: `app/(suite)/mail/_components/MailContent.tsx`

**Fix**:
```diff
- <div className="border border-border rounded-pill bg-dock p-3">
+ <div className="border border-border rounded-pill bg-dock p-4">
```

---

### S12 — Dividers: SuiteLayout adds extra 1px hairline shifting grid by ~2px [STILL PRESENT]

**Problem**: Figma hairlines at x=71, x=319, x=767. SuiteLayout places `w-px bg-border` between dock (72px) and children, then MailContent's `divide-x` grid adds borders at column edges. This shifts everything ~2px right of Figma coordinates.

**Files**: `app/(suite)/layout.tsx`, `app/(suite)/mail/_components/MailContent.tsx`

**Fix** (minor — 2px):
Option A — Move the hairline into the MailContent grid as its first column:
```diff
- grid-cols-[248px_448px_1fr]
+ grid-cols-[1px_248px_448px_1fr]
```
and remove the `w-px bg-border` from SuiteLayout.

Option B — Accept the 2px drift (low impact).

---

## Updated Implementation Order

| Order | Item | Priority | Effort | Files |
|-------|------|----------|--------|-------|
| 1 | P0-5: Dock tile text 14px | P0 | Small | 1 |
| 2 | P0-4: Compose ＋ font 21px | P0 | Trivial | 1 |
| 3 | P0-6: Sidebar horizontal inset | P0 | Small | 1 |
| 4 | P0-7: Unread time color | P0 | Trivial | 1 |
| 5 | P1-16: Reply Send button size | P1 | Trivial | 1 |
| 6 | P1-17: AttachmentCard radius | P1 | Trivial | 1 |
| 7 | P1-18: Compose Bold weight | P1 | Trivial | 1 |
| 8 | P1-19: Compose Send radius | P1 | Trivial | 1 |
| 9 | P1-20: UploadProgress row radius | P1 | Trivial | 1 |
| 10 | P1-21: UploadProgress panel height | P1 | Trivial | 1 |
| 11 | P1-22: Settings/Contacts tab 40px | P1 | Trivial | 2 |
| 12 | P1-23: Settings avatar weight | P1 | Trivial | 1 |
| 13 | P1-24: Contacts stats layout | P1 | Small | 1 |
| 14 | P1-26: ReadingPane subject 26px | P1 | Trivial | 1 |
| 15 | P1-27: Search placeholder 12px | P1 | Trivial | 1 |
| 16 | P2-28: Mock data names | P2 | Small | 1 |
| 17 | P2-34: Network card font sizes | P2 | Trivial | 1 |
| 18 | P2-35: Dock hairline 40px | P2 | Trivial | 1 |
| 19 | P2-36: Presence dot 8px | P2 | Trivial | 1 |
| 20 | P2-37: Label pill weight | P2 | Trivial | 1 |
| 21 | P2-38: Avatar font-size lookup | P2 | Small | 1 |
| 22 | P2-39: Action pill 82px width | P2 | Trivial | 1 |
| 23 | P2-40: Back arrow font-medium | P2 | Trivial | 1 |
| 24 | S12: Divider alignment | P2 | Small | 2 |

---

## Verification

After each change:
```bash
pnpm typecheck   # TypeScript check
pnpm lint        # Next.js lint
pnpm test        # Unit tests
```

Run `pnpm dev` and visually compare against Figma using dimensions overlay or screenshots.
