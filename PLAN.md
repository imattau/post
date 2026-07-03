# Post — Project Plan

A Nostr-based, email-styled private messaging app. First app of the "Nostr Suite"; built on a shared Suite shell so sibling apps (Drive, Calendar, Notes, Contacts, Tasks) can plug in later.

## 1. Decisions (locked)

| Area | Decision |
|------|----------|
| Stack | Next.js (App Router) + React + TypeScript + Tailwind CSS |
| Nostr | Real NIP-17 (DMs) + NIP-44 (encryption) from day one; NIP-59 (gift-wrap) as a follow-up phase |
| Identity | `nostr-tools` key management; npub primary identity, NIP-05 verification as a badge |
| Relays | Relay pool with health monitoring, multi-relay delivery, latency alerts |
| Attachments | Blossom media-server protocol with "Stored in Drive" cross-app stub |
| Deploy | Web first; Tauri desktop wrapper added as a later phase |
| Scope | Post/Mail fully built; shared Suite shell (icon dock, app switcher, identity/relay state, theme tokens) reusable for future apps |
| MVP | Inbox + read + compose + all mailboxes (Starred/Snoozed/Sent/Drafts/Archive/Spam) + Labels + relay health + Blossom attachments |

## 2. Design system (extracted from Figma)

### 2.1 Color tokens (proposed Tailwind theme — `@theme` in `globals.css`)

```
/* Canvas */
--bg-canvas:        #0B0D12;  /* frame + message-list panel */
--bg-dock:          #11141B;  /* icon dock + reading pane + network card */
--bg-sidebar:       #151922;  /* sidebar + search + active row card + pills */
--bg-pill-subtle:   #1B202B;  /* label pills + progress track + attachment thumb #2 */
--bg-modal-2:       #202632;  /* secondary buttons / window controls */
--border-hairline:  #272D3A;  /* all 1px dividers + inactive strokes */
--surface-active:   #2B2146;  /* active mailbox pill + active chip + recipient pill */
--bg-modal-card:    #171B24;  /* compose modal inner card (modal-only) */
--bg-modal-attach:  #11151C;  /* compose attachment card (modal-only) */
--bg-modal-stroke:  #303744;  /* modal hairlines (modal-only) */

/* Brand — purple */
--brand:            #8B5CF6;  /* logo, Compose CTA, Send, active tile stroke */
--brand-light:      #A78BFA;  /* selected letter, counts, icons, bullets, links */

/* Semantic */
--ok:               #34D399;  /* presence, relay status, verified, encrypted text, draft saved */
--info:             #60A5FA;  /* Work label, Drive tile */
--warn:             #FBBF24;  /* Projects label, Notes tile */
--danger:           #FB7185;  /* Receipts label, Contacts tile, Discard */
--teal:             #14B8A6;  /* Tasks tile */

/* Text */
--text-primary:     #FFFFFF;
--text-near-white:   #F3F5F7;  /* warm-white for inbox sidebar + body */
--text-modal:        #F5F7FA;  /* cool-white inside compose modal */
--text-secondary:    #949BAA;  /* standard muted (app) */
--text-modal-2:     #9CA4B3;  /* muted (inside modal) */
--text-tertiary:    #6F7787;  /* placeholders, captions, timestamps */
--text-placeholder: #717A8A;  /* placeholders (inside modal) */

/* Avatar palette (deterministic by npub hash) */
--avatar-1: #7C3AED;  --avatar-2: #2563EB;  --avatar-3: #059669;
--avatar-4: #DB2777; --avatar-5: #D97706;  --avatar-6: #475569;  --avatar-7: #0891B2;
```

### 2.2 Typography — Inter only

Set `Inter` as the global font (next/font). Type ramp (sizes in px):

| Style   | Sizes | Use |
|---------|-------|-----|
| Regular 400 | 10, 11, 12, 13, 14, 15, 19 | body, preview, captions, glyph icons |
| Medium 500 | 10–21 | mailbox labels (mixed), chips, read-row senders, format toolbar, recipient name |
| Semi Bold 600 | 10–25 | brand, mailbox active, app names, subjects (unread), sender (unread), timestamps (unread), subject (reading pane), modal title |
| Bold 700 | 15, 17, 18, 21 | dock logo "N", app letters, attachment thumb glyphs |

### 2.3 Layout grid (1440×1024 reference)

Four vertical panels with 1px `#272D3A` hairlines between them:

| Panel | x | width | bg |
|-------|---|-------|----|
| Icon Dock       | 0–72   | 72  | `#11141B` |
| Sidebar         | 72–320 | 248 | `#151922` |
| Message List    | 320–768| 448 | `#0B0D12` |
| Reading Pane    | 768–1440| 672 | `#11141B` |

Implementation: CSS grid `grid-cols-[72px_249px_449px_1fr]` with `divide-x divide-[#272D3A]`. Heights fill the viewport (`100dvh`); horizontal overflow hidden; reading pane scrolls internally.

### 2.4 Radius scale

| Token | px | Use |
|-------|----|-----|
| `radius-tile`   | 13 | dock logo |
| `radius-tile-2` | 12 | dock tiles |
| `radius-pill`   | 14 | CTA, chips, pills, cards, search bar, attachment cards |
| `radius-progress` | 3 | network progress |
| `radius-modal`  | 20 | compose modal inner card |
| `radius-modal-shadow` | 24 | modal shadow wrapper |

### 2.5 Icons — Unicode glyphs initially, swap to icon set later

Figma uses Unicode glyphs (`＋ ⌕ ⋮ ← ☆ ⌁ ▣ ◷ ➤ ▤ ! ⌁ …`) for everything. v1 renders these as text nodes with Tailwind classes for color/size; phase 2 swaps to a real icon library (lucide-react) once UX iteration settles. Tracked in `ICONS.md`.

## 3. Project structure (proposed)

```
post/
├─ app/
│  ├─ layout.tsx                 # root: providers, theme, font
│  ├─ page.tsx                   # redirects to /mail/inbox (or onboarding)
│  ├─ (suite)/
│  │  └─ layout.tsx              # SuiteShell: icon dock + app switcher + relay/identity context, fills viewport
│  │  └─ mail/
│  │     ├─ layout.tsx           # MailLayout: sidebar + message list + reading pane
│  │     ├─ inbox/page.tsx
│  │     ├─ starred/page.tsx
│  │     ├─ sent/page.tsx
│  │     ├─ drafts/page.tsx
│  │     ├─ archive/page.tsx
│  │     ├─ spam/page.tsx
│  │     └─ labels/[label]/page.tsx
│  └─ onboarding/page.tsx        # key generation / import (out-of-MVP scope, stub)
├─ packages/
│  ├─ suite-shell/               # reusable shell for future Suite apps (out of /app for portability)
│  ├─ nostr-core/                # nostr service: key store, relay pool, NIP-17/44, NIP-59
│  └─ ui/                        # shared primitives (Pill, Avatar, Button, Card, etc.)
├─ lib/
│  ├─ stores/                    # zustand: messages, mailboxes, relays, identity
│  ├─ db/                        # IndexedDB (Dexie) message/event cache + drafts
│  └─ utils/                     # color/avatar/npub formatters
├─ public/fonts/                 # Inter (next/font local)
├─ tailwind.config.ts / globals.css  # design tokens → @theme
├─ PLAN.md  (this file)
├─ ICONS.md
└─ AGENTS.md
```

## 4. Shared Suite shell

The shell is a separate concern so Drive/Calendar/etc. can reuse it later. It provides:

- **`SuiteShellProvider`** — owns identity, relay pool, theme tokens via Context.
- **`IconDock`** — 72px vertical rail:
  - 40×40 logo (purple `#8B5CF6`, radius 13, "N" Bold 17 white).
  - Active app tile (radius 12, fill `#2B2146`, stroke `#8B5CF6`, letter in `#A78BFA`) — Post is active (`M`).
  - Inactive app tiles `D, C, N, P` (stroke `#272D3A`, letter `#949BAA`). Clicking opens app-switcher popover or routes to placeholder "coming soon".
  - Hairline divider, then `⌕` search and `?` help tiles.
  - User avatar (36×36 ellipse, initials, presence dot at bottom-right corner).
- **`AppSwitcher`** — 280×300 popover (`#1B202B`, radius 18, drop shadow):
  - "Nostr Suite" heading + "All apps" link.
  - 3×2 grid of 64×64 tiles (radius 16, stroke `#272D3A`), each with bold colored letter + caption (`#949BAA`): M Post / D Drive / C Calendar / N Notes / P Contacts / T Tasks. Color codes per §2.1.
  - Footer caption "Shared identity · unified search · private by default".
- **Theme tokens** exported from `globals.css` via Tailwind `@theme` so all apps inherit the same palette.
- **Identity + relay context** — single source of truth (nsec/npub, relay list, presence), consumed by Post now and future apps later.

## 4.5 Data models

These TypeScript types define every entity in the system. All components, stores, and nostr-core functions reference these types. Deviating from them constitutes drift.

```typescript
// ─── Identity ───
interface Identity {
  npub: string;             // Bech32-encoded public key
  nsec: string | null;      // Bech32-encoded secret key (null if readonly / NIP-07)
  pubkey: string;           // Hex public key (32 bytes)
  nip05: string | null;     // NIP-05 identifier e.g. "alice@example.com"
  nip05Verified: boolean;   // NIP-05 verification check result
  profile: Profile | null;  // Cached kind 0 metadata
}

interface Profile {
  name: string;
  displayName: string;
  about: string;
  picture: string;
  banner: string;
  website: string;
  nip05: string;
  lud06: string;   // LNURL
  lud16: string;   // Lightning address
}

// ─── Relays ───
interface RelayConfig {
  url: string;              // wss://relay.damus.io
  read: boolean;
  write: boolean;
}

interface RelayStatus {
  url: string;
  connected: boolean;
  latency: number;          // ms, -1 if unknown
  lastEventAt: number;      // Unix timestamp ms
  error: string | null;
}

// ─── Messages ───
type MailboxKind = 'inbox' | 'starred' | 'snoozed' | 'sent' | 'drafts' | 'archive' | 'spam';

interface Message {
  id: string;               // Nostr event id (hex)
  kind: number;             // 14 (NIP-17 DM) or 1059 (NIP-59 gift-wrap)
  pubkey: string;           // Sender pubkey (hex)
  recipientPubkey: string;  // Recipient pubkey (hex)
  content: string;          // Decrypted plaintext (NIP-44)
  raw: string;              // Encrypted ciphertext (for re-encryption on re-import)
  createdAt: number;        // Unix timestamp seconds
  tags: string[][];         // Raw event tags
  subject: string;          // Extracted from tags or first line
  preview: string;          // First ~120 chars of content
  read: boolean;
  starred: boolean;
  archived: boolean;
  snoozedUntil: number | null;  // Unix timestamp ms, null = not snoozed
  spam: boolean;
  mailbox: MailboxKind;     // Derived classification
  labelIds: string[];       // References Label.id
  replyTo: string | null;   // Parent event id (NIP-10 root)
  relayUrls: string[];      // Relays this event was published to
  attachments: AttachmentRef[];
  isEncrypted: boolean;     // true = NIP-44 applied
  isGiftWrapped: boolean;   // true = NIP-59
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed';
}

// ─── Attachments ───
interface AttachmentRef {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;                  // Blossom required
  url: string;                     // Blossom server URL
  storedInDrive: boolean;          // true if uploaded to Drive
  encrypted: boolean;              // Blob-level encryption applied
}

interface AttachmentUpload {
  file: File;
  progress: number;                // 0–100 upload progress
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  error: string | null;
  result: AttachmentRef | null;
}

// ─── Labels ───
interface Label {
  id: string;                      // uuid
  name: string;                    // e.g. "Work", "Friends"
  color: string;                   // hex e.g. "#60A5FA"
  messageIds: string[];            // References Message.id
}

// ─── Drafts ───
interface Draft {
  id: string;                      // uuid
  to: RecipientEntry[];
  cc: RecipientEntry[];
  bcc: RecipientEntry[];
  subject: string;
  body: string;
  attachments: AttachmentUpload[];
  relayOverrides: string[];        // Custom relays for this draft
  createdAt: number;               // Unix timestamp ms
  updatedAt: number;               // Unix timestamp ms
  savedAt: number | null;          // Last autosave timestamp
  scheduledFor: number | null;     // Unix timestamp ms (schedule send)
}

interface RecipientEntry {
  pubkey: string;
  npub: string;
  name: string;                    // Resolved profile name or npub truncation
  avatarUrl: string;
  isGroup: boolean;                // true if group inbox (NIP-17 group)
}

// ─── Contacts ───
interface Contact {
  pubkey: string;
  npub: string;
  name: string;                    // Resolved profile display name
  about: string;
  picture: string;
  nip05: string;
  nip05Verified: boolean;
  lastMessageAt: number;           // Unix timestamp ms
  relayRecommended: string;        // Their preferred relay
}
```

## 5. Post app — component inventory (mapped to Figma)

Each component below maps 1:1 to the Figma element; class names (radius/fill/text) come from §2 tokens. Live in `packages/ui` (if reusable across Suite apps) or `app/(suite)/mail/_components` (mail-specific).

### 5.1 Sidebar

| Component | Spec |
|-----------|------|
| `SidebarBrand`            | "N Mail" Semi Bold 21 `#F3F5F7`; tagline "Private messaging for Nostr" Regular 11 `#949BAA`. |
| `ComposeCTA`              | 200×48 purple `#8B5CF6`, radius 14, glyph `＋` + "Compose" white. Opens compose modal. |
| `MailboxRow`              | Active: 216×38 pill `#2B2146` radius 10, icon purple, label white, count purple right. Inactive: icon + label `#949BAA`, optional count. Icons: `▣ Inbox, ☆ Starred, ◷ Snoozed, ➤ Sent, ▤ Drafts, ⌁ Archive, ! Spam`. |
| `LabelSectionHeader`      | "LABELS" Semi Bold 10 `#6F7787`. |
| `LabelRow`                | `●` dot colored by label, name `#949BAA`. Work=`#60A5FA`, Friends=`#34D399`, Projects=`#FBBF24`, Receipts=`#FB7185`. |
| `NetworkStatusCard`       | 216×142 `#11141B` stroke `#272D3A` radius 14. "Network" Semi Bold 12 white; 8px green dot + "N relays connected"; "Delivery health" caption; progress bar (track `#1B202B`, fill `#34D399` = green ratio); "Synced X sec ago" `#6F7787`. Wired to live relay pool. |

### 5.2 Message list

| Component | Spec |
|-----------|------|
| `ListHeaderBar`           | Title Semi Bold 22 white ("Inbox"); subtitle Regular 11 `#949BAA` ("12 unread"). |
| `SearchBar`              | 400×42 `#151922`, stroke `#272D3A`, radius 12. `⌕` Regular 15 + placeholder "Search messages, people or npubs" `#6F7787`. |
| `FilterChip`             | Active: `#2B2146` stroke `#8B5CF6` text `#A78BFA`. Inactive: `#151922` stroke `#272D3A` text `#949BAA`. Chips: Primary / Unread / Starred / Attachments. Row overflows horizontally with `overflow-x: auto` hidden scrollbar; More button (`⋮`) reveals additional filters or a dropdown. |
| `MoreButton`             | `⋮` Semi Bold 18 `#949BAA`. |
| `MessageRow`             | 424×104 card `#151922` stroke `#272D3A` radius 14 (active variant only; rows otherwise stack with 1px dividers). 40×40 avatar ellipse with deterministic color + initials (Semi Bold 11.2 white). Sender Semi Bold 13 (unread) / Medium 13 (read). Time Semi Bold 11 white (unread) / Regular 11 `#6F7787` (read). Subject Semi Bold 12 (unread) / Medium 12 (read). Preview Regular 11 `#6F7787`. LabelPill 52×28 `#1B202B` radius 14 text `#949BAA`. Unread dot 7×7 `#A78BFA`. |
| `MessageList scroll`     | The entire message list panel scrolls vertically (`overflow-y: auto`) when content exceeds the viewport. On selection via `?c=`, the selected `MessageRow` scrolls into view (`scrollIntoView({ block: 'nearest' })`). |
| `Avatar`                 | ellipse, fill = avatar palette index derived from `hash(npub) mod 7`, initials from name. |

### 5.3 Reading pane

| Component | Spec |
|-----------|------|
| `ReadingTopBar`           | `←` back (Regular 20); pill buttons Archive/Snooze/Delete 82×36 radius 10 `#151922` stroke `#272D3A` text `#949BAA`. Hover: stroke brightens to `#8B5CF6` at 50% opacity, cursor pointer. `☆` star toggle Semi Bold 19; `⋮` more Semi Bold 19. |
| `SubjectLine`             | Semi Bold 25 white. |
| `SubjectPills`            | Work `#2B2146` stroke `#8B5CF6` text `#A78BFA`; Encrypted neutral pill green text `#34D399`; "3 relays" neutral pill `#949BAA`. |
| `SenderBlock`             | 46×46 avatar; sender Semi Bold 14 white; npub truncated `npub1…x9k2` Regular 11 `#6F7787`; "to Matt"; timestamp Right-aligned Regular 11; "✓ verified" Medium 10 right-aligned `#34D399`. |
| `MessageBody`            | Regular 14 paragraphs; bulleted list with 6×6 purple dots + Regular 13 lines. Renders markdown-lite (subset: bold, italic, lists, links). |
| `AttachmentCard`          | 274×88 `#151922` stroke `#272D3A` radius 12. Thumbnail 48×56 tinted; filename Semi Bold 12 white; meta "X MB · Blossom / encrypted" Regular 10 `#6F7787`; action link "Open in Drive" / "Preview" Medium 10 purple. |
| `ReplyComposer`           | 560×130 `#151922` stroke `#272D3A` radius 14; recipient "Alice"; placeholder "Reply to Alice…"; divider; toolbar glyphs B/I/`⌁`/☺; Send 90×34 `#8B5CF6` radius 10 "Send" Semi Bold 12 white. |

### 5.4 Compose modal

| Component | Spec |
|-----------|------|
| `ComposeModal`            | Scrim `rgba(5,7,11,0.44)`; shadow wrapper 730×784 radius 24 with `0 20 40 0 rgba(0,0,0,0.5)`; inner card `#171B24` stroke `#303744` radius 20. |
| `ComposeHeader`           | "New message" Semi Bold 16 `#F5F7FA`; "Draft saved" Medium 11 right-aligned `#34D399`; 30×30 minimize/close (`#202632`, stroke `#303744`, glyphs `–`/`×` `#9CA4B3`). |
| `RecipientField`          | "To" label Medium 12 `#9CA4B3`; recipient pill 210×34 radius 17 `#2B2146` stroke `#8B5CF6` with 22×22 avatar + name + `×` remove; placeholder "Add people, npubs or groups" `#717A8A`; "Cc  Bcc" link Medium 11 purple. |
| `SubjectField`           | "Subject" Medium 12; value Regular 13 `#F5F7FA`. |
| `ComposeBody`             | Regular 14 `#F5F7FA`, full markdown-lite (subset). Autorecipients NIP-44 encryption on send. |
| `ComposeAttachmentCard`   | 326×74 `#11151C` stroke `#303744` radius 12; thumbnail; filename; meta "X MB · encrypted"; "Stored in Drive" Medium 10 `#34D399`; `×` remove. |
| `StatusPills`             | "Encrypted" `#2B2146` stroke `#8B5CF6` green text `#34D399`; "N relays" neutral `#9CA4B3`; "Private" neutral `#9CA4B3`; "Delivery settings" link Medium 11 purple. |
| `FormatToolbar`           | glyphs B I U `⌁` `▣` `☺` `@` `⋯` Semi Bold 13 `#9CA4B3`; "Markdown supported" Regular 10 `#717A8A`. |
| `ComposeFooter`           | `SendButton` split: primary 112×40 `#8B5CF6` radius 12 + 34×40 dropdown `⌄`; "Schedule send" 126×40 `#202632` stroke `#303744` `#9CA4B3`; "Discard" text-only Medium 11 `#FB7185`. |
| `FloatingComposeAnnotation`| (annotation only — drop in production; document the draggable/resizable/minimizable/autosaves drafts requirements in `ICONS.md` or a UX doc and implement as v2 polish). |

## 6. Screens & states

### 6.1 Route table

The app uses Next.js App Router under `(suite)/mail/`. The `layout.tsx` in `(suite)/mail/` renders `<MailLayout />` (three-pane shell) which reads `selectedConversationId` from the URL search params to populate the reading pane.

| Route | Mailbox filter | Reading pane | Notes |
|-------|---------------|--------------|-------|
| `/mail/inbox` | `mailbox: 'inbox'`, not archived, not spam, not snoozed | Nothing selected (empty state) | Default redirect from `/` |
| `/mail/inbox?c=<eventId>` | Same as above | `Message` with `eventId` | Reading pane driven by query param, not path segment |
| `/mail/starred` | `starred: true` | Nothing or `?c=` |
| `/mail/snoozed` | `snoozedUntil > now` | Nothing or `?c=` |
| `/mail/sent` | `pubkey === identity.pubkey` | Nothing or `?c=` |
| `/mail/drafts` | From `drafts` Dexie table | Nothing or `?c=` | Opens compose modal if creating new |
| `/mail/archive` | `archived: true` | Nothing or `?c=` |
| `/mail/spam` | `spam: true` | Nothing or `?c=` |
| `/mail/labels/[labelId]` | `labelIds.includes(labelId)` | Nothing or `?c=` |
| `/?compose=true` | Current mailbox | Current or none | Floating compose modal overlay; preserved across mailbox nav |

The `?c=` query param approach means the reading pane selection is not part of the path — refreshing the page preserves the open message without requiring nested route segments.

### 6.2 State list

1. **Inbox + open message** — default route. Three-pane mail layout; reading pane shows one selected thread; an "All apps" popover (dismissable) demonstrates the Suite shell.
2. **Compose (floating modal)** — overlays a scrim + centered 710×760 card on the inbox.
3. **Other mailboxes** — Starred, Snoozed, Sent, Drafts, Archive, Spam, and per-label pages reuse the same `MailLayout` with different filtered `MessageList` sources.
4. **Empty state** (not in Figma) — defined as part of MVP polish for "no messages" lists and "no message selected" reading pane.

## 7. Nostr core service (`packages/nostr-core`)

Built on `nostr-tools`. Surfaces a framework-agnostic API consumed via Zustand stores / React context.

Every exported function has a typed signature below. Implementations must match these exactly.

### 7.1 Key store

```typescript
// packages/nostr-core/src/keys.ts

export function generateKey(): { nsec: string; npub: string; pubkey: string };

export function importFromNsec(nsec: string): { npub: string; pubkey: string } | Error;

export function importFromNpub(npub: string): { pubkey: string } | Error;

export function formatNpub(npub: string): string;
// Returns truncated form e.g. "npub1alice…x9k2"

export interface KeyStore {
  load(): Identity | null;
  save(identity: Identity): void;
  clear(): void;
}
```

- `KeyStore` stores plaintext session in-memory; future: NIP-07 extension, nsec backups (NIP-46 bunker remote-signer optional).
- `Identity` type per §4.5.
- `formatNpub(npub)` → `npub1alice…x9k2` truncation (first 10 chars + `…` + last 4 chars of hex after bech32 decode).

### 7.2 Relays

```typescript
// packages/nostr-core/src/relays.ts

export function createRelayPool(relays: RelayConfig[]): RelayPool;

export interface RelayPool {
  connectAll(): Promise<void>;
  disconnectAll(): void;
  getStatus(): RelayStatus[];
  subscribe(filters: NostrFilter[], cb: (event: NostrEvent) => void): () => void;
  // Returns unsubscribe function
  publish(event: NostrEvent, targetRelays?: string[]): Promise<Map<string, boolean>>;
  // Returns map of relayUrl → success/fail
  getHealthPercent(): number;
  // Returns 0–100 based on connected count / total
  getSyncedAgo(): number;
  // Seconds since last event received across any relay
}

// Default seed relays
export const DEFAULT_RELAYS: RelayConfig[] = [
  { url: 'wss://relay.damus.io', read: true, write: true },
  { url: 'wss://relay.nostr.band', read: true, write: true },
  { url: 'wss://nos.lol', read: true, write: true },
  { url: 'wss://relay.snort.social', read: true, write: true },
  { url: 'wss://purplepag.es', read: true, write: false },
];
```

- `RelayMonitor` message producer — emulates the "Relay Monitor" sender delivering `One relay is responding slowly / relay.damus.io latency is above your preferred threshold` warnings (real telemetry from the pool → wrapped as a system message with kind 14).
- `RelayConfig`, `RelayStatus` types per §4.5.

### 7.3 Messaging — NIP-17 + NIP-44

```typescript
// packages/nostr-core/src/messages.ts

export interface SendOptions {
  to: string;                    // Recipient pubkey (hex)
  content: string;               // Plaintext
  subject?: string;
  attachments?: AttachmentRef[];
  replyTo?: string;              // Parent event id
  relayOverrides?: string[];     // Override default relay set
  giftWrap?: boolean;            // NIP-59 (phase 2)
}

export interface SendResult {
  eventId: string;
  published: Map<string, boolean>;  // relayUrl → published
  delivered: number;                 // Count of successful relay publishes
}

export function sendMessage(
  pool: RelayPool,
  keys: KeyStore,
  opts: SendOptions
): Promise<SendResult>;

export function replyToThread(
  pool: RelayPool,
  keys: KeyStore,
  rootEventId: string,
  content: string,
  attachments?: AttachmentRef[]
): Promise<SendResult>;

export function decryptEvent(
  event: NostrEvent,
  keys: KeyStore
): Promise<string>;
// Decrypts NIP-44 content with the recipient's key

export function decryptIncoming(
  pool: RelayPool,
  keys: KeyStore
): AsyncGenerator<Message>;
// Subscribes to kind 14 events addressed to keys.pubkey,
// decrypts each, yields Message objects
```

- DMs per NIP-17 (kind 14) using NIP-44 encryption (v2 cipher).
- NIP-10 tags for threading: `["e", <rootEventId>, <relayUrl>, "root"]` on root, `["e", <parentEventId>, <relayUrl>, "reply"]` on replies.
- `GiftWrap` (NIP-59) — sealed sender mode offered as a UX toggle ("Private" pill); exposed via `opts.giftWrap` in phase 2.

### 7.4 Profile resolution

```typescript
// packages/nostr-core/src/profiles.ts

export function fetchProfile(
  pool: RelayPool,
  pubkey: string
): Promise<Profile | null>;
// Subscribes to kind 0, returns parsed metadata

export function resolveNip05(
  nip05: string
): Promise<{ pubkey: string; verified: boolean } | null>;

export function searchProfiles(
  pool: RelayPool,
  query: string
): Promise<Contact[]>;
// Searches kind 0 events by name/displayName via relay search

export function batchFetchProfiles(
  pool: RelayPool,
  pubkeys: string[]
): Promise<Map<string, Profile>>;
```

### 7.5 Blossom

```typescript
// packages/nostr-core/src/blossom.ts

export interface BlossomServer {
  url: string;    // e.g. https://blossom.example.com
}

export function uploadBlob(
  server: BlossomServer,
  file: File,
  pubkey: string,
  onProgress?: (percent: number) => void
): Promise<AttachmentRef>;
// Uses NIP-98 HTTP auth (Authorization: Nostr <event>)
// Returns server-generated sha256 + url

export function downloadBlob(
  ref: AttachmentRef
): Promise<ArrayBuffer>;

export function deleteBlob(
  server: BlossomServer,
  sha256: string,
  pubkey: string
): Promise<void>;
```

### 7.6 Encryption UX

"Encrypted" pill required on every outgoing message (NIP-44 baseline); "Private" pill adds NIP-59 gift-wrap when toggled; "N relays" pill shows current pool size to recipient; "Delivery settings" opens relay selection for that send.

## 8. Attachment storage — Blossom

- Implemented via `packages/nostr-core/src/blossom.ts` — exports `uploadBlob`, `downloadBlob`, `deleteBlob` (signatures in §7.5).
- Attachments become references (`AttachmentRef`) stored as encrypted NIP-44 content with the blob descriptor (sha256, url, mime, size).
- "Stored in Drive" link opens the blob in the (local) Nostr Drive app — for v1 this is a stub URL `mailto:.../drive?blob=<sha256>` that no-ops.
- Encryption: encrypt blob descriptor (and optionally the bytes stream — phase 2) before announcing.
- Reading pane shows the cached blob via local URL.

## 9. Persistence

### 9.1 Dexie schema (IndexedDB)

```typescript
// lib/db/schema.ts
import Dexie, { type EntityTable } from 'dexie';

export class PostDB extends Dexie {
  messages!: EntityTable<Message, 'id'>;
  drafts!: EntityTable<Draft, 'id'>;
  labels!: EntityTable<Label, 'id'>;
  contacts!: EntityTable<Contact, 'pubkey'>;
  relayConfigs!: EntityTable<RelayConfig, 'url'>;

  constructor() {
    super('PostDB');
    this.version(1).stores({
      messages: 'id, pubkey, recipientPubkey, createdAt, read, starred, archived, spam, mailbox, *labelIds',
      drafts: 'id, updatedAt, scheduledFor',
      labels: 'id, name',
      contacts: 'pubkey, name, lastMessageAt',
      relayConfigs: 'url',
    });
  }
}

export const db = new PostDB();
```

Indexes enable efficient mailbox queries:
- Inbox: `db.messages.where({ mailbox: 'inbox', archived: 0, spam: 0 })`
- Starred: `db.messages.where({ starred: 1 })`
- Snoozed: chain `.filter(m => m.snoozedUntil !== null && m.snoozedUntil > Date.now())`
- Sent: `db.messages.where({ pubkey: identity.pubkey })`
- By label: `db.messages.where('labelIds').equals(labelId)`

### 9.2 Zustand store shapes

```typescript
// lib/stores/messages.ts
interface MessagesState {
  byId: Record<string, Message>;
  ids: string[];                                    // Ordered by createdAt desc
  selectedId: string | null;                        // Currently open in reading pane
  loading: boolean;
  error: string | null;

  // Derived from dexie via sync
  loadFromCache: () => Promise<void>;
  selectMessage: (id: string | null) => void;       // Updates selectedId + URL ?c=
  markRead: (id: string) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  toggleArchive: (id: string) => Promise<void>;
  toggleSpam: (id: string) => Promise<void>;
  snooze: (id: string, until: number) => Promise<void>;
  delete: (id: string) => Promise<void>;
  ingestFromRelay: (message: Message) => void;     // Dedup + insert
}

// lib/stores/mailboxes.ts
type MailboxTab = 'inbox' | 'starred' | 'snoozed' | 'sent' | 'drafts' | 'archive' | 'spam';

interface MailboxState {
  current: MailboxTab;
  unreadCounts: Record<MailboxTab, number>;
  filter: 'primary' | 'unread' | 'starred' | 'attachments';
  navigate: (tab: MailboxTab) => void;              // Updates URL
  setFilter: (filter: string) => void;
  refreshUnreadCounts: () => Promise<void>;
}

// lib/stores/labels.ts
interface LabelsState {
  byId: Record<string, Label>;
  allIds: string[];
  createLabel: (name: string, color: string) => Promise<string>;
  deleteLabel: (id: string) => Promise<void>;
  assignLabel: (messageId: string, labelId: string) => Promise<void>;
  removeLabel: (messageId: string, labelId: string) => Promise<void>;
}

// lib/stores/relays.ts
interface RelaysState {
  relays: RelayConfig[];
  statuses: Record<string, RelayStatus>;
  healthPercent: number;
  syncedAgo: number;                                // Seconds
  addRelay: (config: RelayConfig) => void;
  removeRelay: (url: string) => void;
  updateStatuses: () => Promise<void>;
}

// lib/stores/identity.ts
interface IdentityState {
  identity: Identity | null;
  keyStore: KeyStore | null;
  createOrImport: (nsec?: string) => Promise<Identity>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

// lib/stores/compose.ts
type ComposeStatus = 'closed' | 'composing' | 'minimized' | 'sending' | 'scheduled';

interface ComposeState {
  status: ComposeStatus;
  draft: Draft;
  uploads: AttachmentUpload[];
  encrypted: boolean;
  giftWrap: boolean;
  relayOverrides: string[];
  open: (replyTo?: Message) => void;
  close: () => void;
  minimize: () => void;
  restore: () => void;
  updateRecipients: (to: RecipientEntry[], cc: RecipientEntry[], bcc: RecipientEntry[]) => void;
  updateSubject: (subject: string) => void;
  updateBody: (body: string) => void;
  addAttachment: (file: File) => void;
  removeAttachment: (id: string) => void;
  toggleEncrypted: () => void;
  toggleGiftWrap: () => void;
  setRelayOverrides: (relays: string[]) => void;
  send: () => Promise<SendResult>;
  scheduleSend: (at: number) => Promise<void>;
  autosave: () => Promise<void>;                    // On keystroke debounce (1s)
  discard: () => void;
  resetDraft: () => void;                           // Clear after send
}
```

### 9.3 Sync flow

```
RelayPool.subscribe(filters) ──> decryptIncoming() ──> messages.ingestFromRelay()
                                                              │
                                                              ▼
                                                         db.messages.put()
                                                              │
                                                              ▼
                                                      UI re-renders via Zustand selector
```

Optimistic UX: list renders from local cache; new events streamed in from relays in background. Outgoing messages written to Dexie immediately (`deliveryStatus: 'pending'`), then updated to `'sent'`/`'failed'` based on publish results.

## 10. Tauri desktop (later phase)

- `src-tauri/` → single Rust binary wrapping the Next.js static export.
- Native window controls align with compose modal's minimize/close styling.
- Secure nsec storage in OS keychain via Tauri plugin.
- Offline-first: relays reconnect when network returns; drafts encrypted at rest.

## 11. Build phases & milestones

| Phase | Outcome | Status check |
|------|---------|--------------|
| **P0 — Scaffold** | Next.js + TS + Tailwind v4 + ESLint + Prettier + Vitest + Playwright; design tokens in `globals.css`; `SuiteShell` skeleton (icon dock + app switcher stub). Route `/mail/inbox` renders empty three-pane grid. | `pnpm dev` shows the four-pane layout with dock + switcher popover. |
| **P1 — Static mail UI** | All §5 components implemented with hardcoded mock data matching the Figma (seven sample threads matching the Figma: Alice, Jonas, Sofia, Nostr Photos, Daniel, Relay Monitor, Lena Chen; Alice open message, compose modal wired open/close). Static pixel review against Figma. | Lighthouse a11y > 90; visual diff signoff. |
| **P2 — nostr-core v1** | `KeyStore`, `RelayPool`, NIP-17 + NIP-44 send/receive; `NetworkStatusCard` driven by real relay stats; npub resolution to profiles (NIP-05). | Send a real DM between two npubs; receive in a fresh browser session. |
| **P3 — Real inbox** | Dexie persistence; relays stream into `messages` store; mailboxes filter; reply thread; search across messages/people/npubs. | Live inbox populated only from real events; drafts autosave. |
| **P4 — Blossom attachments** | `BlossomClient` upload with NIP-98 auth; encrypted blob descriptor; AttachmentCard renders + "Stored in Drive" stub; download/decrypt in reading pane. | Send 2 MB attachment; recipient opens in reading pane. |
| **P5 — Labels & filters** | Full mailbox nav (Starred/Snoozed/Sent/Drafts/Archive/Spam) backed by Dexie flags; Labels CRUD; per-label pages; filter chips wired to store queries. | Every nav path returns the right subset; labels persist. |
| **P6 — Compose polish + NIP-59** | Floating/draggable/minimizable modal; markdown formatting toolbar; Send split-button with Send/Preview/Save/Cancel; Schedule send via local scheduler; NIP-59 gift-wrap "Private" pill. | Modal minimized → restored with content intact; scheduled send fires offline. |
| **P7 — Tauri desktop** | Export Next as static + Tauri wrapper; OS keychain nsec; tray presence; auto-update. | Installable `.dmg`/`.AppImage`/`.msi` build working and signed. |
| **P8 — Hardening** | E2E tests; i18n; keyboard a11y; empty/error states; latency/relay-loss UX; NIP-07 extension support; backup/export nsec. | Test suite green; release-ready. |

## 12. Testing strategy

### 12.0 Tooling setup

```
devDependencies to install:
  vitest, @vitejs/plugin-react, jsdom, @testing-library/react,
  @testing-library/jest-dom, @testing-library/user-event,
  @playwright/test, msw
```

Config files: `vitest.config.ts` (React plugin, jsdom, path aliases), `playwright.config.ts` (headless Chromium, localhost:3000 base URL). Test script entries in `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:e2e": "playwright test"`.

### 12.1 Phase 1 — Unit tests (Vitest, pure logic, no DOM)

#### `packages/nostr-core/src/keys.ts`

| Test | What it verifies |
|------|-----------------|
| `generateKey()` | Returns `{ nsec, npub, pubkey }` with valid bech32 nsec/npub + 64-char hex pubkey |
| `generateKey()` determinism | Different calls produce different keys |
| `importFromNsec(nsec)` | Returns correct npub + pubkey for a known nsec |
| `importFromNsec(invalid)` | Returns `Error` for garbage string, wrong-length hex |
| `importFromNpub(npub)` | Returns correct pubkey |
| `importFromNpub(invalid)` | Returns `Error` for invalid npub |
| `formatNpub(npub)` | Returns `npub1first…last4` truncated form |
| `formatNpub(invalid)` | Returns input unchanged |
| `KeyStore.load()` | Returns null when localStorage is empty |
| `KeyStore.save()` | Persists identity to localStorage |
| `KeyStore.clear()` | Removes identity from localStorage |

#### `packages/nostr-core/src/messages.ts`

Mocks: `nostr-tools` (NIP-17 `wrapEvent`, NIP-44), pool.publish.

| Test | What it verifies |
|------|-----------------|
| `sendMessage()` | Calls pool.publish with wrapped event, returns `SendResult` |
| `sendMessage()` — no key | Throws when `keys.load()` returns null |
| `sendMessage()` — no nsec | Throws when identity has no nsec |
| `sendMessage()` — delivery count | `delivered` property counts successful relay publishes |
| `replyToThread()` | Calls `sendMessage` with `replyTo` set to `rootEventId` |
| `decryptEvent()` | Decrypts `event.content` using NIP-44 conversation key |
| `decryptEvent()` — bad key | Throws on decryption failure |
| `decryptIncoming()` | Returns `AsyncGenerator` that yields `Message` objects from kind 14 events |

#### `packages/nostr-core/src/relays.ts`

Mocks: `SimplePool` via `vi.mock("nostr-tools/pool")`.

| Test | What it verifies |
|------|-----------------|
| `DEFAULT_RELAYS` | Contains 5 relay configs with correct URLs |
| `createRelayPool()` | Returns object with all `RelayPool` methods |
| `connectAll()` | Calls `ensureRelay` for each URL, tracks connected/latency |
| `connectAll()` — partial failure | One relay fails, others still tracked as connected |
| `getStatus()` | Returns correct `RelayStatus[]` after connect |
| `getHealthPercent()` | 100 when all connected, 0 when none, correct fraction |
| `getSyncedAgo()` | Returns seconds since last event |
| `subscribe()` | Delegates to `simplePool.subscribeMany`, returns unsubscribe |
| `publish()` | Returns `Map<url, boolean>` with per-relay success/failure |
| `disconnectAll()` | Calls `pool.destroy()`, clears all state |

#### `packages/nostr-core/src/profiles.ts`

| Test | What it verifies |
|------|-----------------|
| `fetchProfile()` | Subscribes to kind 0, parses event.content as Profile |
| `fetchProfile()` — timeout | Resolves null if no event within 5s |
| `fetchProfile()` — bad JSON | Resolves null gracefully |
| `resolveNip05("user@domain")` | Calls `nip05.queryProfile`, returns pubkey |
| `resolveNip05("invalid")` | Returns null |
| `searchProfiles()` | Subscribes to kind 0 with search filter, returns `Contact[]` |
| `batchFetchProfiles()` | Subscribes to kind 0 for multiple pubkeys, returns `Map` |

#### `packages/nostr-core/src/blossom.ts`

| Test | What it verifies |
|------|-----------------|
| `uploadBlob()` | Sends PUT with `Authorization` header via `nip98.getToken` |
| `uploadBlob()` — progress | Calls `onProgress` with 0, interim, 100 |
| `uploadBlob()` — response | Parses `sha256`, `url` from response JSON |
| `uploadBlob()` — HTTP error | Rejects with error message |
| `downloadBlob()` | Fetches blob with auth header, returns `ArrayBuffer` |
| `deleteBlob()` | Sends DELETE with auth header |
| `deleteBlob()` — HTTP error | Rejects |

#### `lib/stores/*` (Zustand)

Pattern: create store via the exported `use*Store` function, call actions, assert state changes. Dexie calls are mocked with `vi.mock("@/lib/db/schema")`.

| Store | Tests |
|-------|-------|
| **identity** | `createOrImport()` generates key + saves to KeyStore; `logout()` clears identity; `connectNip07()` reads `window.nostr.getPublicKey()`; `nip07Available` true when `window.nostr` exists; `getSigner()` returns signing function in NIP-07 mode |
| **relays** | `connect()` creates pool + updates statuses; `addRelay()` / `removeRelay()` mutates relay list; `disconnect()` clears pool + statuses; `updateStatuses()` refreshes health/syncedAgo from pool |
| **messages** | `loadFromCache()` hydrates from Dexie; `selectMessage(id)` sets `selectedId`; `markRead()` flips read flag + persists; `toggleStar()` / `toggleArchive()` / `toggleSpam()` flip boolean + derive mailbox; `snooze(id, until)` sets `snoozedUntil`; `deleteMessage()` removes from store + Dexie; `ingestFromRelay()` dedup inserts |
| **mailboxes** | `navigate(tab)` sets `current`; `setFilter(filter)` updates; `refreshUnreadCounts()` queries Dexie |
| **labels** | `createLabel()` returns id + persists; `deleteLabel()` removes from store + Dexie; `assignLabel()` adds messageId to label's `messageIds`; `removeLabel()` removes messageId |
| **compose** | State machine: `closed→composing→minimized→composing→sending→sent→closed` with all §20 transitions; `failed→composing` on edit; `scheduleSend()` sets scheduledFor; `autosave()` writes to Dexie with `savedAt` timestamp; `discard()` clears draft + deletes from Dexie; guard: send button disabled during sending; guard: minimize blocked with empty draft |
| **blossom** | `setServerUrl(url)` persists to localStorage; `uploadFile()` calls `uploadBlob` with decoded sk; `loadBlossomConfig()` restores from localStorage |

#### `lib/sync.ts`

| Test | What it verifies |
|------|-----------------|
| `startSync()` | Subscribes to kind 14 events for user's pubkey |
| `startSync()` — no pool | No-ops gracefully |
| `startSync()` — no identity | No-ops gracefully |
| `stopSync()` | Unsubscribes existing subscription |
| `loadCachedMessages()` | Loads messages from Dexie into zustand `byId` / `ids` |
| `searchMessages(query)` | Returns messages matching subject, preview, content, or pubkey |
| `searchMessages("")` | Returns all messages when query empty |
| `getMailboxMessages("inbox")` | Filters: not archived, not spam, not snoozed |
| `getMailboxMessages("starred")` | Filters: `starred: true` |
| `getMailboxMessages("archive")` | Filters: `archived: true` |

#### `lib/db/schema.ts`

| Test | What it verifies |
|------|-----------------|
| `PostDB` | Creates Dexie instance with name `"PostDB"` |
| Version 1 stores | Exists with tables: messages, drafts, labels, contacts, relayConfigs |
| Messages indexes | Indexes on `id, pubkey, recipientPubkey, createdAt, read, starred, archived, spam, mailbox, *labelIds` |

### 12.2 Phase 2 — Component tests (Vitest + React Testing Library + JSDOM)

All components rendered with mock props. User interactions via `@testing-library/user-event`.

#### Avatar

| Test | What it verifies |
|------|-----------------|
| Renders initials | Pass `initials="AL"` → text "AL" visible |
| Deterministic color | Same initials → same background colour class |
| Size prop | `size={46}` → rendered element has correct pixel dimensions |
| Font size | Scales proportionally to `size` |

#### EmptyState

| Test | What it verifies |
|------|-----------------|
| All props | Icon + title + description + action rendered |
| Optional props | Renders without icon, description, or action |
| Action slot | Action node is clickable |

#### MessageRow

| Test | What it verifies |
|------|-----------------|
| Unread state | Sender + subject use `font-semibold`, unread dot 7×7 visible |
| Read state | Sender + subject use `font-medium`, dot hidden |
| Selected state | Background `bg-sidebar`, 3px left `border-brand` |
| Default state | Border-bottom divider, transparent bg |
| Click | Calls `onClick()` with message id |
| Label pills | Each label rendered as 52×28 pill with text |
| Timestamp format | "now", "5m", "3h", "Jan 5" depending on age |

#### MessageListView

| Test | What it verifies |
|------|-----------------|
| Empty state | Shows EmptyState with "No messages yet" |
| Message list | Renders `MessageRow` for each message in array |
| Search filters | Typing in search reduces visible rows |
| Filter chips | Clicking "Unread" shows only unread; "Starred" shows starred |
| Keyboard nav | ArrowDown/ArrowUp changes selection via router |

#### SubjectPills

| Test | What it verifies |
|------|-----------------|
| Label pills | Each label name rendered with correct colour dot |
| Encrypted pill | Green text `#34D399`, border `#272D3A` |
| Relay count pill | Neutral text `#949BAA`, shows "3 relays" |
| Empty labels | No pills rendered |

#### SenderBlock

| Test | What it verifies |
|------|-----------------|
| Name + npub | Both rendered |
| Recipient | Shows "to {recipientName}" |
| Verified | Shows "✓ verified" in `#34D399` when true; hidden when false |
| Timestamp | Formatted as "Jan 5, 3:45 PM" |
| Avatar | 46px rendered via Avatar component |

#### MessageBody

| Test | What it verifies |
|------|-----------------|
| Bold text | `**text**` renders as `<strong>text</strong>` |
| Bullet list | Lines starting with `•` render with 6×6 purple dot |
| Numbered list | Lines starting with `1.` render with counter |
| Empty lines | Render as 8px spacers |
| Plain paragraphs | Rendered as `<p>` with regular text |

#### AttachmentCard

| Test | What it verifies |
|------|-----------------|
| File info | Filename + formatted size rendered |
| Encrypted meta | Shows " / encrypted" when `encrypted={true}` |
| Preview button | Only shown when `mimeType.startsWith("image/")` |
| Drive link | Links to `/coming-soon?app=D&blob={sha256}` |
| Size formatting | < 1 MB shows KB; ≥ 1 MB shows "X.X MB" |

#### ReadingTopBar

| Test | What it verifies |
|------|-----------------|
| Back button | Click calls `onBack()` |
| Star toggle | Click calls `onToggleStar()`; star is `☆` |
| Starred state | Star uses `text-warn` when `starred={true}`, muted when false |
| Action pills | Archive, Snooze, Delete buttons present |
| More button | `⋮` button present |

#### ReplyComposer

| Test | What it verifies |
|------|-----------------|
| Placeholder | Shows "Reply to {name}…" |
| Format buttons | B, I, ⌁, ☺ present |
| Send button | Present, calls nothing on click (no callback prop) |

#### ReadingPane

| Test | What it verifies |
|------|-----------------|
| Integrates sub-components | All sub-components visible with correct props |
| Attachments | AttachmentCard rendered for each attachment |
| Reply | ReplyComposer at bottom |
| Scroll | Container has `overflow-y-auto` |

#### IconDock

| Test | What it verifies |
|------|-----------------|
| Logo tile | 40×40 purple bg, "N" text |
| Post tile | Active: `bg-surface-active` + `border-brand`, "M" |
| Inactive tiles | D, C, N, P — border only, muted letter |
| Search tile | `⌕` glyph |
| Help tile | `?` glyph |
| Avatar | 36×36 ellipse, initials, presence dot |
| Tile click | Opens AppSwitcher popover |
| Avatar click | Opens IdentityDialog |

#### AppSwitcher

| Test | What it verifies |
|------|-----------------|
| 3×2 grid | Six app tiles (M/D/C/N/P/T) rendered |
| Post tile link | Navigates to `/mail/inbox` |
| Contacts tile link | Navigates to `/contacts` |
| Coming-soon tiles | D, C, N, T link to `/coming-soon?app=X` |
| Escape closes | Press Escape → calls `onClose()` |
| Click outside | Mousedown outside → calls `onClose()` |
| Footer text | "Shared identity · unified search · private by default" |

#### IdentityDialog

| Test | What it verifies |
|------|-----------------|
| npub display | Shows identity.npub |
| Auth method | Shows "Local Key Store" or "NIP-07 Browser Extension" |
| nsec (local mode) | Shows truncated nsec + Copy + Download buttons |
| NIP-07 mode | Shows explanation text instead of nsec buttons |
| Copy button | Copies nsec to clipboard, shows "Copied!" feedback |
| Download button | Triggers file download |
| Disconnect | Calls `logout()` + `onClose()` |
| Close × | Calls `onClose()` |

#### ComposeModal

| Test | What it verifies |
|------|-----------------|
| Composing state | Full modal visible with all fields |
| Subject input | Typing updates subject in store |
| Body input | Typing updates body in store |
| Minimize → closed | Click – → store.minimize() called; minimized bar renders |
| Minimized bar | Shows subject + recipient, click restores, × closes |
| Sent state | "Message sent" success card, auto-closes after 1.5s |
| Sending state | Send button disabled with spinner |
| Failed state | Error message + Retry button visible |
| Split send menu | Click chevron → dropdown with Send/Preview/Save Draft/Discard |
| Schedule send | Click → date/time inputs → Schedule button |
| Attach file | Click ▣ → file input triggered |
| Format toolbar | B, I, U, ⌁, ▣, ☺, @, ⋯ buttons present |
| Status pills | Encrypted (green), 3 relays (neutral), Private (toggle) |
| Private pill | Click toggles giftWrap, shows "Private ✓" when active |
| Close × | Calls discard() + onClose() |
| Disabled states | Send disabled when no recipient; Spinner when sending |

#### UploadProgress

| Test | What it verifies |
|------|-----------------|
| Header | "Uploading N files" + "X of Y complete" |
| File rows | Each file: name, size, progress bar visible |
| Uploading colour | Amber `#FBBF24` progress bar + percentage text |
| Complete colour | Green `#34D399` progress bar + "Complete" text |
| Failed colour | Red `#FB7185` progress bar + "Failed" text |
| Pending state | No progress bar shown |
| Footer | "Encrypting before upload · N providers selected" |
| Hide button | Click → calls `onHide()` |

#### Settings page

| Test | What it verifies |
|------|-----------------|
| 5 sidebar tabs | General, Identity, Relays, Privacy, Notifications — clickable, active state |
| General tab | Two toggles visible |
| Identity tab | Avatar card, NIP-05 input+verify, signing method pills, export button |
| Relays tab | Auto-select toggle, relay count badge, connected relay list, add relay input, delivery toggles |
| Privacy tab | Three toggles visible |
| Notifications tab | Four toggles visible |
| Toggle interaction | Each toggle flips ON/OFF with pill switch animation |

#### Contacts page

| Test | What it verifies |
|------|-----------------|
| 4 sidebar tabs | Overview, Following, Muted, Blocked |
| Overview stats | 4 stat cards (328/14/6/9) with labels |
| Contact card | Avatar 36×36, name, @handle, npub, bio, status chip, timestamp, ⋮ |
| Status chip colours | Following=purple, Muted=yellow, Blocked=red |
| Profile detail | Click contact card → 88×88 avatar header + status actions |
| Back button | "← Back to contacts" returns to list |
| Search | Filters contacts by name |
| Tab filter | Following/Muted/Blocked tabs show only matching contacts |

### 12.3 Phase 3 — E2E tests (Playwright, headless browser)

#### Navigation & layout

| Test | Steps |
|------|-------|
| App loads inbox | Navigate to `/` → redirects to `/mail/inbox`; Dock, sidebar, message list, reading pane visible |
| Mailbox navigation | Click Inbox → `/mail/inbox`; Click Starred → `/mail/starred`; Click Sent → `/mail/sent`; each shows correct header |
| Message selection | Click message row → reading pane opens; URL has `?c=<eventId>` |
| Escape clears | Escape → reading pane shows "Select a message to read"; URL has no `?c=` |
| Keyboard nav | ArrowDown/ArrowUp cycles through messages |
| Compose modal open | Click Compose CTA → modal visible; Click × → modal closed |
| Contacts page | Navigate to `/contacts` → sidebar tabs + contact list visible |
| Settings page | Navigate to `/settings` → 5 sidebar tabs, content area |

#### Compose flow

| Test | Steps |
|------|-------|
| Subject | Type in subject → value updates in store |
| Minimize/restore | Click – → minimized bar; Click bar → restores |
| Split send menu | Click chevron → dropdown with 4 items |
| Schedule send | Click "Schedule send" → date/time inputs; Fill → Schedule |
| Attach file | Click ▣ → file picker → upload progress overlay shows |

#### Reading pane actions

| Test | Steps |
|------|-------|
| Star | Click ☆ → active state (warn colour) |
| Back | Click ← → `?c=` removed, empty pane |

#### Identity dialog

| Test | Steps |
|------|-------|
| Open | Click avatar in dock → dialog opens |
| Close | Click Done → dialog closes |
| Copy nsec | Click Copy nsec → "Copied!" feedback |

#### Settings toggles

| Test | Steps |
|------|-------|
| Toggle all | Each toggle clickable, visual ON/OFF state changes |

#### Contacts interaction

| Test | Steps |
|------|-------|
| Tab switch | Click Muted → only muted contacts shown |
| Search | Type in search → list filters |
| Card click | Click contact → profile detail with 88×88 avatar + actions |

### 12.4 Phase 4 — Visual / Snapshot tests (optional)

- Storybook stories for all 15 components in `components/` covering: default, hover, active, disabled, selected, read/unread states
- Snapshot tests for key visual variants:
  - `MessageRow`: read / unread / selected / active card variant
  - `SubjectPills`: with labels / encrypted only / empty
  - `EmptyState`: with all props / icon+title only / action present
  - `ComposeModal`: composing / sending (spinner) / sent (success) / minimized bar / failed (error+retry)
  - `UploadProgress`: mixed state (uploading+complete) / all complete / single file / empty
  - `Settings page`: each of the 5 tabs rendered in isolation
  - `Contacts page`: Overview with stats / Following list / profile detail

### 12.5 Priority order

1. **`nostr-core` unit tests** — highest risk surface (crypto, relay pool, messaging) — 30 tests
2. **Store unit tests** — state machines control all app behaviour; bugs here cause drift — 40 tests
3. **Component integration tests** — `ComposeModal` (18 scenarios), `MessageRow` (6), `UploadProgress` (6) — 50 tests
4. **E2E navigation** — validates routing and panel layout — 10 tests
5. **E2E compose/reading-pane flow** — critical path for the app's primary function — 10 tests

Total: ~140 tests across all phases.

## 13. Risks & open questions

1. **NIP-59 vs NIP-17 default** — Figma shows both "Encrypted" and "Private" pills. Recommend NIP-44/17 baseline, NIP-59 opt-in. Confirm UX priority.
2. **Nsec custody** — web-only web apps can't safely hold nsec long-term. For MVP we store encrypted in IndexedDB with passphrase; later phase uses NIP-07 extension or NIP-46 bunker. OK?
3. **Relay list ownership** — UI exposes relay selection per-message ("Delivery settings"). Confirm we want per-send relay override vs. always pool-default.
4. **Markdown scope** — Confirm the formatting toolbar subset (bold, italic, underline, link, code, emoji, mention, attach). Code blocks / lists / quotes — yes/no?
5. **App switcher routing** — Inactive dock tiles: route to "Coming soon" page or just open the switcher popover? Is the dock inter-app nav needed in v1 at all?
6. **Drive integration depth (v1)** — Right now all "Stored in Drive" links are inert stubs. Confirm — no real Drive app needed in v1.
7. **Snooze** — locally computed (no NIP kind for snooze) or rejected as out-of-MVP? Recommend local-only flag in Dexie.

## 14. Definition of done (MVP)

- User can generate/import an npub, configure relays, and see the network card reflect real status.
- User can compose a real NIP-17/NIP-44 DM to an npub (autocomplete by profile), attach a file via Blossom, and the recipient reveals it.
- Inbox lists real received DMs; clicking opens the reading pane; reply composer sends threaded replies.
- All mailboxes and labels are wired and persistent across reloads.
- Compose modal: draft autosave, recipient pills, Cc/Bcc, encryption + relay pills, markdown toolbar best effort, Send + Schedule send.
- App builds as web (`pnpm build`) — desktop shell punted to P7.

## 15. Settings screen (extracted from Figma Frame #9)

A full-page settings panel accessed from the app switcher popover (via the active dock tile or the "All apps" link) or directly via `/suite/settings`. Replaces the three-pane mail layout entirely — same 72px icon dock persists on the left.

### 15.1 Layout

| Region | x | width | bg |
|--------|---|-------|----|
| Icon Dock | 0–72 | 72 | `#11141B` |
| Settings sidebar | 72–320 | 248 | `#151922` |
| Settings content | 320–1440 | 1120 | `#0B0D12` |

### 15.2 Settings sidebar tabs

Five tab items, 216×40 pill `#2B2146` radius 10 when active, same layout as mailbox rows:

| Icon | Tab | Description |
|------|-----|-------------|
| `⌘` | General | Core behaviour for Post and shared suite features. |
| `◎` | Identity | Manage your Nostr identity, profile metadata and signing method. |
| `◉` | Relays | Control how Post discovers, publishes and retrieves events. |
| `◆` | Privacy | Encryption, metadata exposure and local data controls. |
| `●` | Notifications | Choose what appears in the suite notification centre. |

### 15.3 General tab

- **Default post privacy** — toggle: "Choose whether new posts begin as private, public or remember your last choice."
- **Use built-in reader** — toggle: "Use the built-in reader where possible."

### 15.4 Identity tab

- **Current identity card** — avatar (88×88 `#1B202B` radius 18, deterministic colour per §2.1 avatar palette, white initials Semi Bold 25), name, @handle, npub truncated
- **NIP-05** — input field + verify button
- **Signing method** — NIP-07 extension / Local Key Store / NIP-46 bunker selector
- **Profile metadata** — name, display name, about, picture, banner, website, Lightning address
- **Export identity** — "Identity backup.json" button

### 15.5 Relays tab

| Component | Spec |
|-----------|------|
| **Automatic relay selection** | Toggle ON/OFF. Subtitle: "Use contact lists and event hints to select relays." |
| **Minimum relay count** | Picker with badge "3 relays". Subtitle: "Send private posts to at least three healthy relays." |
| **Connected relays** | Section header `#F3F5F7`. List of relay rows (e.g. `relay.damus.io`, `relay.nostr.band`) with latency + connected status dot. Show/hide toggle for URL. 82×28 "Remove" button. |
| **Add relay** | Input field + "Add" button (brand). |
| **Show relay delivery preview** | Toggle. Subtitle: "Display the relay set before sending." |
| **Download profile metadata** | Toggle. Subtitle: "Download profile metadata, relay list and contact graph." |
| **Prefer recipient relay lists** | Toggle. Subtitle: "Prefer recipient relay lists when delivering private posts." |

### 15.6 Privacy tab

| Toggle | Subtitle |
|--------|----------|
| Encrypt direct posts | Use supported Nostr encryption for private communication. |
| Encrypt attachments | Encrypt files before uploading to Drive or Blossom. |
| Hide notification content | Do not show content in desktop notifications. |

### 15.7 Notifications tab

| Toggle | Subtitle |
|--------|----------|
| New private posts | Notify for new private posts. |
| Mentions and replies | Notify when someone mentions or replies to you. |
| Digest summaries | Bundle low-priority activity into summaries. |
| Delivery failure alerts | Alert when a post cannot reach its target relays. |

## 16. Contacts / People screen (extracted from Figma Frame #13)

A full-page contacts manager, replacing the three-pane mail layout. Same left icon dock.

### 16.1 Layout

| Region | x | width |
|--------|---|-------|
| Icon Dock | 0–72 | 72 |
| Contacts sidebar | 72–320 | 248 |
| Contacts content | 320–1440 | 1120 |

### 16.2 Contacts sidebar tabs

Four tab items, 216×40 pill `#2B2146` radius 10 when active:

| Icon | Tab | Description |
|------|-----|-------------|
| `◎` | Overview | Summary stats + all contacts |
| `✓` | Following | People and identities currently in your contact list |
| `–` | Muted | Muted people. Can still message you; hidden from notifications |
| `×` | Blocked | Blocked identities |

### 16.3 Stats bar (Overview tab)

Four stat cards in a row (744×132 card, `#151922` stroke `#272D3A` radius 14):

| Stat | Value | Label |
|------|-------|-------|
| Following | 328 | Semi Bold 28 white |
| Muted | 14 | Semi Bold 28 white |
| Blocked | 6 | Semi Bold 28 white |
| Groups | 9 | Semi Bold 28 white |

Each stat has a subtitle in Regular 11 `#949BAA`.

### 16.4 Contact card (in list)

| Spec | Value |
|------|-------|
| Avatar | 36×36 ellipse, deterministic colour from npub hash, initials |
| Name | Semi Bold 15 `#F3F5F7` |
| @handle | Medium 11 `#A78BFA` |
| npub | Regular 10 `#6F7787` truncated (e.g. `npub1alice…x9k2`) |
| Bio | Regular 10 `#6F7787` (e.g. "Designer · Melbourne") |
| Status chip | 82×28 radius 14 pill. Following=`#2B2146` stroke `#8B5CF6` text `#A78BFA`. Muted=`#FBBF24`. Blocked=`#FB7185`. |
| Timestamp | Regular 10 `#6F7787` right-aligned (Today, Yesterday, Friday, etc.) |
| More | `⋮` Semi Bold 16 `#949BAA` opens actions menu |
| Search | 400×42 `#151922` stroke `#272D3A` radius 12 at top of content area |

### 16.5 Contact detail (profile header)

When a contact is selected, the content area shows a profile header with:
- 88×88 avatar (radius 18)
- Name, @handle, npub
- Status actions: Following (active purple pill) / Mute / Block
- Message timeline below

### 16.6 Route

The contacts screen lives at `/suite/contacts` in the route table, accessed via the dock "P" tile or the app switcher.

## 17. File upload progress overlay (extracted from Figma Frame #12 overlay)

An overlay panel that appears during compose modal attachment uploads. Positioned at (886, 594) relative to canvas, width 500, height 340.

### 17.1 Overlay spec

| Property | Value |
|----------|-------|
| Scrim | `rgba(5, 7, 11, 0.35)` full-screen |
| Panel bg | `#11141B` |
| Stroke | `#272D3A`, 1px |
| Radius | 18px |
| Width | 500px |
| Height | 340px |
| Position | x: 886, y: 594 (centred-bottom-right) |

### 17.2 Header

- "Uploading 3 files" — Semi Bold 16 `#F5F7FA` at (910, 616)
- "2 of 3 complete" — Medium 11 `#949BAA` right-aligned at (1260, 620)

### 17.3 File progress rows

Each row is a 452×60 card (`#151922` stroke `#272D3A` radius 12) with:

| Element | Spec |
|---------|------|
| Thumbnail | 36×36 `#1B202B` radius 9, bold 14 coloured letter |
| Filename | Semi Bold 12 `#F3F5F7` (e.g. "Product-demo.mp4") |
| Size | Regular 10 `#6F7787` (e.g. "284 MB") |
| Progress | Percentage right-aligned (e.g. "72%" in `#FBBF24` for in-progress, "Complete" in `#34D399` for done) |
| Progress bar | 288×4 track `#1B202B` radius 2, fill `#FBBF24` (uploading) or `#34D399` (complete) |

Three file cards shown in the Figma:
1. Product-demo.mp4 (284 MB, 72%) — amber progress bar
2. Research-pack.pdf (18.4 MB, Complete) — green
3. Notes-export.md (84 KB, Complete) — green

### 17.4 Footer

- "Encrypting before upload · 3 providers selected" — Regular 10 `#949BAA` at (910, 902)
- "Hide" — Medium 11 `#A78BFA` right-aligned, closes the overlay

### 17.5 State variants

| State | Progress bar colour | Percentage text |
|-------|-------------------|-----------------|
| Pending | None | — |
| Uploading (0–99%) | `#FBBF24` (amber) | `#FBBF24` e.g. "72%" |
| Complete | `#34D399` (green) | "Complete" in `#34D399` |
| Failed | `#FB7185` (red) | "Failed" in `#FB7185` |

### 17.6 Interaction

- "Hide" link dismisses the overlay; upload continues in background
- Overlay auto-closes when all files complete
- Re-open from compose modal attachment area

## 18. Interaction specification

Every interactive component must implement the states below. Use Tailwind `group`/`peer` variants or CSS classes. Transition duration: `150ms ease-in-out` for micro-interactions, `200ms` for panel slides, `250ms` for modal open/close.

### 18.1 Button / clickable base

| State | Change | Tailwind equivalent |
|-------|--------|---------------------|
| Default | As spec'd in §5 | — |
| Hover | Raise opacity 0.9 or lighten bg 5% | `hover:brightness-110` |
| Active / Press | Scale 0.97, darken bg 10% | `active:scale-[0.97] active:brightness-90` |
| Focus-visible | 2px `#8B5CF6` ring, offset 2px | `focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D12]` |
| Disabled | Opacity 0.4, cursor not-allowed | `disabled:opacity-40 disabled:cursor-not-allowed` |

### 18.2 MailboxRow (sidebar nav)

| State | Change |
|-------|--------|
| Default | Icon + label `#949BAA` (inactive) |
| Hover (inactive) | Icon + label `#F3F5F7` at 60% |
| Selected (active mailbox) | 216×38 pill `#2B2146` radius 10, icon `#A78BFA`, label white, count `#A78BFA` |

### 18.3 MessageRow (message list)

| State | Change |
|-------|--------|
| Default | As spec'd, 1px bottom divider (`#272D3A`), bg transparent |
| Hover | bg `#151922` at 60% opacity overlay |
| Selected (reading pane open) | bg `#151922`, left 3px `#8B5CF6` accent border |
| Unread dot | 7×7 `#A78BFA` ellipse visible |
| Read (after click) | Sender / subject switch from Semi Bold to Medium weight, unread dot hidden |

### 18.4 FilterChip (message list header)

| State | Change |
|-------|--------|
| Active | bg `#2B2146`, stroke `#8B5CF6`, text `#A78BFA` |
| Hover (inactive) | stroke `#8B5CF6` at 50% opacity |
| Inactive default | bg `#151922`, stroke `#272D3A`, text `#949BAA` |

### 18.5 Reading pane pills (Work / Encrypted / 3 relays)

| State | Change |
|-------|--------|
| Work (active label) | bg `#2B2146`, stroke `#8B5CF6`, text `#A78BFA` |
| Encrypted | bg transparent, stroke `#272D3A`, text `#34D399` |
| 3 relays (neutral) | bg transparent, stroke `#272D3A`, text `#949BAA` |
| Hover (any pill) | `brightness-110` |

### 18.6 IconDock tiles

| State | Change |
|-------|--------|
| Selected (active app) | bg `#2B2146`, stroke `#8B5CF6`, letter `#A78BFA` |
| Inactive default | bg transparent, stroke `#272D3A`, letter `#949BAA` |
| Hover (inactive) | bg `#11141B` (same as dock bg, but let colour shine 50% brighter via `brightness-125`) |
| Logo tile (always "N") | bg `#8B5CF6`, radius 13, white letter — no interactive states |

### 18.7 Avatar (message row + reading pane)

| State | Change |
|-------|--------|
| Default | Ellipse with deterministic fill, white initials |
| Hover | `brightness-110`, cursor pointer (click opens npub profile sidebar in phase 2) |

### 18.8 Compose modal transitions

| Action | Animation |
|--------|----------|
| Open | Scale from 0.95 → 1, opacity 0 → 1 over 250ms ease-out |
| Close | Scale 1 → 0.95, opacity 1 → 0 over 200ms ease-in |
| Minimize | Translate to bottom-right (position fixed), scale to 0.8, 200ms ease-in-out |
| Restore | Reverse of minimize, 200ms ease-in-out |
| Scrim | Opacity 0 → `rgba(5,7,11,0.44)` over 200ms on open, reverse on close |

### 18.9 AppSwitcher popover

The popover is a 280×300 card (`#1B202B`, radius 18, stroke `#272D3A`, drop shadow) positioned at (1112,74) relative to the canvas, overlapping the reading pane's top-right corner. It is rendered within a z-index layer above all panels.

| State / Action | Behavior |
|----------------|----------|
| Closed (default) | Not rendered in DOM. |
| Open trigger | Click on any inactive dock tile (`D`, `C`, `N`, `P`, `⌕`, `?`) or the active app tile. Also toggled by an explicit trigger button. |
| Open animation | Scale 0.95 → 1, opacity 0 → 1 over 200ms ease-out. |
| Close trigger | Click outside the popover boundary, press `Escape`, or click/tap one of the 6 app tiles. |
| Close animation | Scale 1 → 0.95, opacity 1 → 0 over 150ms ease-in. |
| Tile click | Each 64×64 tile navigates to the corresponding app route. Post/Mail (`M`) navigates to `/mail/inbox`. Inactive tiles (`D`, `C`, `N`, `P`, `T`) navigate to placeholder `"/coming-soon?app=<letter>"`. |
| Focus management | On open, first tile receives focus. Tab cycles through the 6 tiles. Escape closes and returns focus to the trigger element. |
| Z-index | 50 (above reading pane, below compose modal scrim). |
| Z-index (scrim overlap) | No scrim behind the popover — it floats over content with its own drop shadow. If compose modal is open, the popover renders below the compose scrim layer. |

Keyboard: Arrow keys navigate tiles in grid order (left/right/up/down). Enter/Space selects.

## 19. Responsive behavior

The reference canvas is 1440×1024. Below are the breakpoints and what changes at each. Note: responsive desktop mail apps typically do not support mobile widths; the minimum supported width is **900px** for MVP. Mobile-first responsive is phase 2.

| Breakpoint | Panel behavior |
|------------|---------------|
| ≥ 1440px | Four panels as specified in §2.3. Layout centered in the viewport with max-width 1440px, horizontally centered. |
| 1100–1439px | Reading pane shrinks from 672px → `1fr` remainder. Message list maintains 400px min-width. Sidebar maintains 248px. Dock stays 72px. |
| 900–1099px | Reading pane collapses to full-width overlay (slide from right) toggled by selecting a message. Message list + sidebar + dock remain visible. Reading pane has prominent `←` back button (already in spec). Sidebar folds to icons-only (width collapses to 72px, labels hidden, text labels visible as tooltips). Compose button shows only the `＋` icon. |
| < 900px | Not supported in MVP. Show a "Open in browser" prompt. Covers mobile and very narrow desktop windows. Phase 2 adds a mobile layout. |

Implementation approach: use CSS `@container` queries where possible so the reading pane self-manages its collapsed state independently of viewport width. The `MailLayout` component reads a `useWindowSize()` or CSS container query to toggle between `layout: 'three-pane'` and `layout: 'overlay-pane'`.

## 20. Compose state machine

The compose modal has a defined lifecycle. AI must implement exactly the transitions below; any other transition is a bug.

```
                    ┌──────────────────────────────────┐
                    │           closed                  │
                    └─────┬────────────────────────────┘
                          │ open()
                          ▼
                    ┌──────────────────────────────────┐
              ┌─────│         composing                │◄────┐
              │     │  (draft exists, user editing)    │     │
              │     └─────┬──────────────┬─────────────┘     │
              │           │              │                   │
              │     autosave()      minimize()               │
              │           │              │                   │
              │           ▼              ▼                   │
              │    ┌──────────┐   ┌──────────┐               │
              │    │draft_saved│   │ minimized│───────────────┘
              │    │ (toast:   │   │ (draft   │ restore()
              │    │ "Draft    │   │ persists)│
              │    │ saved")   │   └──────────┘
              │    └──────────┘
              │           │
              │      send() or scheduleSend()
              │           │
              │           ▼
              │    ┌──────────────────────────────────┐
              │    │          sending                  │
              │    │  (Send button disabled, shows     │
              │    │   spinner, "Sending..." label)    │
              │    └─────┬──────────────┬─────────────┘
              │          │              │
              │     publish OK    publish fail
              │          │              │
              │          ▼              ▼
              │    ┌──────────┐   ┌──────────┐
              │    │  sent    │   │  failed  │
              │    │ (toast:  │   │ (toast:  │
              │    │ "Sent")  │   │ "Send    │
              │    │  then    │   │  failed" │
              │    │ close()  │   │ │ user   │
              │    │  reset   │   │ │ retry  │
              │    │  draft   │   │ │close() │
              │    └──────────┘   └────┬─────┘
              │                        │ discard()
              │                        ▼
              │                  ┌──────────┐
              │                  │ discard  │
              │                  │ (toast:  │
              │                  │ "Draft   │
              │                  │  deleted")│
              │                  └──────────┘
              │                        │
              └────────────────────────┘
                         │
                         ▼
                     ┌──────────┐
                     │  closed  │
                     └──────────┘
```

### Transition rules

| From | To | Trigger | Side effects |
|------|----|---------|-------------|
| `closed` | `composing` | User clicks Compose CTA or Reply button | Draft initialized from blank or reply-to template; modal opens with animation |
| `composing` | `closed` | User clicks `×` close button + no unsaved changes | Modal closes immediately |
| `composing` | `closed` | User clicks `×` + unsaved changes | Show "Discard draft?" confirmation dialog; if confirmed, `discard()` then close; if cancelled, stay in `composing` |
| `composing` | `minimized` | User clicks minimize `–` button | Modal slides to bottom-right corner, scrim removed; draft remains in zustand |
| `minimized` | `composing` | User clicks minimized tab/bar | Modal restores to centered position, scrim reappears |
| `composing` | `draft_saved` | `autosave()` fires (1s after last keystroke) | Writes to Dexie; shows green "Draft saved" indicator for 3s in compose header |
| `composing` | `sending` | User clicks Send (or Schedule fires) | Send button disabled + spinner; `sendMessage()` called |
| `sending` | `sent` | `sendMessage()` resolves successfully | Toast "Sent"; modal auto-closes after 1.5s; draft deleted from Dexie; message appears in Sent mailbox |
| `sending` | `failed` | `sendMessage()` rejects | Toast "Send failed — tap to retry"; Send button re-enabled; draft preserved |
| `failed` | `closed` | User clicks `×` or Discard | `discard()`; draft deleted from Dexie |
| `failed` | `composing` | User edits draft content | Automatically returns to composing state |
| `failed` | `sending` | User clicks Send again | Retry flow |
| `composing` | `closed` (scheduled) | User clicks Schedule send | Draft saved with `scheduledFor` timestamp; modal closes; draft remains in Dexie for cron check |

### Autosave behavior

- Triggers 1 second after the user stops typing (debounce).
- Writes to both Zustand (`compose.draft`) and Dexie (`db.drafts.put()`).
- On page reload, checks Dexie for drafts with `savedAt !== null` and prompts "You have an unsaved draft. Restore?".
- Scheduled drafts (`scheduledFor !== null`) are checked on app startup via `setInterval` every 60s (or via a `setTimeout` per draft) and automatically sent when the scheduled time arrives.

### Guard conditions (must always hold)

1. When `status === 'closed'`, `draft` must be the empty/initial state (all fields blank).
2. When `status === 'sending'`, the Send button must be disabled and show a spinner.
3. When `status === 'minimized'`, the draft must be persisted in Dexie (autosaved at least once).
4. When `status === 'sent'`, the draft must be cleared from both Zustand and Dexie within 1.5s of success.
5. Minimize is only available when at least one recipient is filled (prevents accidental minimization of empty drafts).