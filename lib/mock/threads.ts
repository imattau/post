export interface MockContact {
  id: string;
  name: string;
  npub: string;
  avatarInitials: string;
  verified: boolean;
}

export interface MockAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  url: string;
  encrypted: boolean;
}

export interface MockMessage {
  id: string;
  sender: MockContact;
  recipientName: string;
  subject: string;
  preview: string;
  body: string;
  createdAt: number;
  read: boolean;
  starred: boolean;
  labels: string[];
  attachments: MockAttachment[];
  encrypted: boolean;
  relayCount: number;
  threadLength: number;
}

const now = Date.now();
const MIN = 60_000;
const HOUR = 3600_000;
const DAY = 86400_000;

export const CONTACTS: Record<string, MockContact> = {
  alice: {
    id: "alice",
    name: "Alice Nguyen",
    npub: "npub1alice…x9k2",
    avatarInitials: "AL",
    verified: true,
  },
  jonas: {
    id: "jonas",
    name: "Jonas Berg",
    npub: "npub1jonas…x3f7",
    avatarInitials: "J",
    verified: false,
  },
  sofia: {
    id: "sofia",
    name: "Sofia",
    npub: "npub1sofia…p8m1",
    avatarInitials: "S",
    verified: true,
  },
  nostrPhotos: {
    id: "nostr-photos",
    name: "Nostr Photos",
    npub: "npub1photo…v4k9",
    avatarInitials: "NP",
    verified: true,
  },
  daniel: {
    id: "daniel",
    name: "Daniel",
    npub: "npub1daniel…r2t5",
    avatarInitials: "D",
    verified: false,
  },
  relayMonitor: {
    id: "relay-monitor",
    name: "Relay Monitor",
    npub: "npub1relay…h7j3",
    avatarInitials: "RM",
    verified: true,
  },
  lena: {
    id: "lena",
    name: "Lena Chen",
    npub: "npub1lena…w6f2",
    avatarInitials: "LC",
    verified: true,
  },
};

export const MESSAGES: MockMessage[] = [
  {
    id: "msg-1",
    sender: CONTACTS.alice,
    recipientName: "Matt",
    subject: "Hey! Great news on the NIP-17 implementation 🎉",
    preview: "The team was really impressed with how you handled the encryption layer. I think we should discuss the relay selection strategy for the alpha release...",
    body: `Hey Matt,

The team was really impressed with how you handled the encryption layer for NIP-44. The audit came back clean — no major findings.

I think we should discuss the relay selection strategy for the alpha release. A few things to consider:

1. **Default relay set** — Damus, Nostr.band, nos.lol should cover most users
2. **Fallback behavior** — When a relay is down, we need automatic failover
3. **Latency monitoring** — Already built into the NetworkStatusCard

Alice

• NIP-44 implementation review
• Relay pool architecture
• Alpha release timeline`,
    createdAt: now - 15 * MIN,
    read: false,
    starred: true,
    labels: ["Work"],
    attachments: [],
    encrypted: true,
    relayCount: 3,
    threadLength: 4,
  },
  {
    id: "msg-2",
    sender: CONTACTS.jonas,
    recipientName: "Matt",
    subject: "Re: Blossom server setup",
    preview: "I've got the Blossom server running on my end. The upload endpoint is responding correctly with sha256 verification. Let me know when you want to test the attachment flow end-to-end...",
    body: `I've got the Blossom server running on my end. The upload endpoint is responding correctly with sha256 verification.

Let me know when you want to test the attachment flow end-to-end. I've also added NIP-98 HTTP auth support.

Jonas`,
    createdAt: now - 2 * HOUR,
    read: false,
    starred: false,
    labels: ["Work", "Projects"],
    attachments: [],
    encrypted: true,
    relayCount: 3,
    threadLength: 2,
  },
  {
    id: "msg-3",
    sender: CONTACTS.sofia,
    recipientName: "Matt",
    subject: "Design review: compose modal animations",
    preview: "I've pushed the latest Figma changes for the compose modal. The animation specs are in the design system doc — 250ms ease-out for open, 200ms ease-in for close...",
    body: `I've pushed the latest Figma changes for the compose modal.

The animation specs are in the design system doc:
- Open: 250ms ease-out, scale 0.95 → 1
- Close: 200ms ease-in, scale 1 → 0.95
- Minimize: 200ms ease-in-out, translate to bottom-right

Let me know if the implementation matches.

Sofia`,
    createdAt: now - 5 * HOUR,
    read: true,
    starred: false,
    labels: ["Work"],
    attachments: [],
    encrypted: true,
    relayCount: 3,
    threadLength: 6,
  },
  {
    id: "msg-4",
    sender: CONTACTS.nostrPhotos,
    recipientName: "Matt",
    subject: "Your shared photos from the Nostr meetup",
    preview: "Here are the 4 photos from yesterday's meetup. Shot on iPhone — uploaded via Blossom with client-side encryption. Open in Drive for the full resolution versions...",
    body: `Here are the photos from yesterday's meetup!

All uploaded via Blossom with client-side encryption. Open in Drive for full resolution.

Cheers,
Nostr Photos`,
    createdAt: now - 12 * HOUR,
    read: false,
    starred: false,
    labels: [],
    attachments: [
      {
        id: "att-1",
        fileName: "meetup-group.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 2_400_000,
        sha256: "a1b2c3d4e5f6...",
        url: "https://blossom.example.com/a1b2c3d4",
        encrypted: true,
      },
      {
        id: "att-2",
        fileName: "whiteboard.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1_800_000,
        sha256: "b2c3d4e5f6a7...",
        url: "https://blossom.example.com/b2c3d4e5",
        encrypted: true,
      },
      {
        id: "att-3",
        fileName: "group-dinner.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 3_100_000,
        sha256: "c3d4e5f6a7b8...",
        url: "https://blossom.example.com/c3d4e5f6",
        encrypted: true,
      },
    ],
    encrypted: true,
    relayCount: 3,
    threadLength: 1,
  },
  {
    id: "msg-5",
    sender: CONTACTS.daniel,
    recipientName: "Matt",
    subject: "Nostr Core — dependency update",
    preview: "Just a heads up — nostr-tools v2.11 has a breaking change in the relay pool API. The connect() method now returns a promise that resolves when all relays are connected...",
    body: `Just a heads up — nostr-tools v2.11 has a breaking change in the relay pool API.

The connect() method now returns a promise that resolves when all relays are connected (or rejects with a list of failed ones).

We should update our adapter before the next release.

Daniel`,
    createdAt: now - 1 * DAY,
    read: true,
    starred: false,
    labels: ["Work", "Projects"],
    attachments: [],
    encrypted: true,
    relayCount: 3,
    threadLength: 3,
  },
  {
    id: "msg-6",
    sender: CONTACTS.relayMonitor,
    recipientName: "Matt",
    subject: "⚠️ Relay latency warning",
    preview: "One relay is responding slowly. relay.damus.io latency is above your preferred threshold of 500ms. Current average: 1,230ms. Consider switching to a faster relay...",
    body: `One relay is responding slowly.

relay.damus.io latency is above your preferred threshold of 500ms.

- Current average: 1,230ms
- Threshold: 500ms
- Status: Degraded

Recommended action: Consider switching to a faster relay or reviewing your relay configuration.

This is an automated message from Relay Monitor.`,
    createdAt: now - 2 * DAY,
    read: true,
    starred: false,
    labels: [],
    attachments: [],
    encrypted: false,
    relayCount: 2,
    threadLength: 1,
  },
  {
    id: "msg-7",
    sender: CONTACTS.lena,
    recipientName: "Matt",
    subject: "Coffee next week?",
    preview: "Hey! It's been a while. Would love to catch up and hear about what you're building with Nostr. Free Tuesday or Thursday afternoon? Let me know what works...",
    body: `Hey Matt,

It's been a while! Would love to catch up and hear about what you're building with Nostr.

I'm free Tuesday or Thursday afternoon next week. Let me know what works for you.

Best,
Lena`,
    createdAt: now - 3 * DAY,
    read: true,
    starred: false,
    labels: [],
    attachments: [],
    encrypted: true,
    relayCount: 3,
    threadLength: 2,
  },
];
