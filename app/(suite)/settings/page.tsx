"use client";

import { useState } from "react";

type SettingsTab = "General" | "Identity" | "Relays" | "Privacy" | "Notifications";

const TABS: { icon: string; id: SettingsTab; description: string }[] = [
  { icon: "⌘", id: "General", description: "Core behaviour for Post and shared suite features." },
  { icon: "◎", id: "Identity", description: "Manage your Nostr identity, profile metadata and signing method." },
  { icon: "◉", id: "Relays", description: "Control how Post discovers, publishes and retrieves events." },
  { icon: "◆", id: "Privacy", description: "Encryption, metadata exposure and local data controls." },
  { icon: "●", id: "Notifications", description: "Choose what appears in the suite notification centre." },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("General");

  return (
    <div className="flex-1 grid grid-cols-[248px_1fr] divide-x divide-border">
      {/* Sidebar */}
      <div className="bg-sidebar p-4">
        <div className="mb-5">
          <h1 className="text-text-near-white text-[21px] font-semibold">Settings</h1>
        </div>
        <nav className="flex flex-col gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 h-10 px-3 rounded-[10px] text-left transition-all duration-150 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-surface-active text-white"
                  : "text-text-secondary hover:text-text-near-white hover:brightness-110"
              }`}
            >
              <span className="text-[15px]">{tab.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] ${activeTab === tab.id ? "font-semibold" : "font-medium"}`}>
                  {tab.id}
                </p>
                <p className="text-[10px] text-text-tertiary truncate leading-tight">{tab.description}</p>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-canvas p-8 overflow-y-auto">
        {activeTab === "General" && <GeneralTab />}
        {activeTab === "Identity" && <IdentityTab />}
        {activeTab === "Relays" && <RelaysTab />}
        {activeTab === "Privacy" && <PrivacyTab />}
        {activeTab === "Notifications" && <NotificationsTab />}
      </div>
    </div>
  );
}

function ToggleRow({ label, description, defaultOn }: { label: string; description: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn ?? false);
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50">
      <div className="flex-1 pr-4">
        <p className="text-[14px] font-medium text-text-primary">{label}</p>
        <p className="text-[11px] text-text-tertiary mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer ${
          on ? "bg-brand" : "bg-pill-subtle"
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
            on ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h3 className="text-[12px] font-semibold text-text-near-white mt-6 mb-3">{title}</h3>;
}

function GeneralTab() {
  return (
    <div>
      <h2 className="text-[28px] font-semibold text-text-primary">General</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Core behaviour for Post and shared suite features.</p>
      <ToggleRow label="Default post privacy" description="Choose whether new posts begin as private, public or remember your last choice." />
      <ToggleRow label="Use built-in reader" description="Use the built-in reader where possible." defaultOn />
    </div>
  );
}

function IdentityTab() {
  return (
    <div>
      <h2 className="text-[28px] font-semibold text-text-primary">Identity</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Manage your Nostr identity, profile metadata and signing method.</p>

      <SectionHeader title="Current Identity" />
      <div className="flex items-center gap-5 p-4 border border-border rounded-pill bg-sidebar max-w-lg">
        <div className="w-[88px] h-[88px] rounded-[18px] bg-pill-subtle flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[25px] font-semibold">AL</span>
        </div>
        <div>
          <p className="text-[18px] font-semibold text-text-primary">Alice Nguyen</p>
          <p className="text-[11px] text-brand-light">@alice</p>
          <p className="text-[10px] text-text-tertiary">npub1alice…x9k2</p>
        </div>
      </div>

      <SectionHeader title="NIP-05" />
      <div className="flex items-center gap-2 max-w-lg">
        <input
          type="text"
          placeholder="alice@example.com"
          className="flex-1 h-9 px-3 text-[13px] bg-sidebar border border-border rounded-pill text-text-primary placeholder-text-placeholder outline-none"
        />
        <button className="h-9 px-4 rounded-pill bg-brand text-white text-[12px] font-semibold cursor-pointer hover:brightness-110">Verify</button>
      </div>

      <SectionHeader title="Signing Method" />
      <div className="flex gap-2 max-w-lg">
        {["NIP-07 Extension", "Local Key Store", "NIP-46 Bunker"].map((method) => (
          <button
            key={method}
            className={`h-9 px-4 rounded-pill text-[12px] font-medium border cursor-pointer transition-all ${
              method === "NIP-07 Extension"
                ? "bg-surface-active border-brand text-brand-light"
                : "bg-sidebar border-border text-text-secondary hover:border-brand/50"
            }`}
          >
            {method}
          </button>
        ))}
      </div>

      <SectionHeader title="Export Identity" />
      <button className="h-9 px-4 rounded-pill bg-modal-2 border border-border text-text-modal-2 text-[12px] font-medium cursor-pointer hover:brightness-110 transition-all">
        Identity backup.json
      </button>
    </div>
  );
}

function RelaysTab() {
  return (
    <div>
      <h2 className="text-[28px] font-semibold text-text-primary">Relays</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Control how Post discovers, publishes and retrieves events.</p>

      <ToggleRow label="Automatic relay selection" description="Use contact lists and event hints to select relays." defaultOn />

      <div className="flex items-center justify-between py-3 border-b border-border/50">
        <div className="flex-1 pr-4">
          <p className="text-[14px] font-medium text-text-primary">Minimum relay count</p>
          <p className="text-[11px] text-text-tertiary mt-0.5">Send private posts to at least three healthy relays.</p>
        </div>
        <span className="h-[26px] px-3 rounded-pill border border-border text-text-secondary text-[11px] font-medium leading-[26px]">3 relays</span>
      </div>

      <SectionHeader title="Connected Relays" />
      <div className="space-y-1 max-w-lg">
        {["relay.damus.io", "relay.nostr.band", "nos.lol", "relay.snort.social", "purplepag.es"].map(
          (relay, i) => (
            <div
              key={relay}
              className="flex items-center gap-3 h-10 px-3 rounded-[8px] hover:bg-sidebar/60 transition-colors"
            >
              <div className={`w-2 h-2 rounded-full ${i < 3 ? "bg-ok" : "bg-text-tertiary"}`} />
              <span className="flex-1 text-[13px] text-text-primary">{relay}</span>
              <span className="text-[10px] text-text-tertiary">{i < 3 ? `${12 + i * 3}ms` : "—"}</span>
              <button className="text-[10px] text-danger hover:brightness-110 cursor-pointer hidden group-hover:block">Remove</button>
            </div>
          )
        )}
      </div>
      <div className="flex items-center gap-2 mt-3 max-w-lg">
        <input
          type="text"
          placeholder="wss://relay.example.com"
          className="flex-1 h-9 px-3 text-[13px] bg-sidebar border border-border rounded-pill text-text-primary placeholder-text-placeholder outline-none"
        />
        <button className="h-9 px-4 rounded-pill bg-brand text-white text-[12px] font-semibold cursor-pointer hover:brightness-110">Add</button>
      </div>

      <SectionHeader title="Delivery" />
      <ToggleRow label="Show relay delivery preview" description="Display the relay set before sending." defaultOn />
      <ToggleRow label="Download profile metadata" description="Download profile metadata, relay list and contact graph." defaultOn />
      <ToggleRow label="Prefer recipient relay lists" description="Prefer recipient relay lists when delivering private posts." defaultOn />
    </div>
  );
}

function PrivacyTab() {
  return (
    <div>
      <h2 className="text-[28px] font-semibold text-text-primary">Privacy</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Encryption, metadata exposure and local data controls.</p>

      <ToggleRow label="Encrypt direct posts" description="Use supported Nostr encryption for private communication." defaultOn />
      <ToggleRow label="Encrypt attachments" description="Encrypt files before uploading to Drive or Blossom." defaultOn />
      <ToggleRow label="Hide notification content" description="Do not show content in desktop notifications." />
    </div>
  );
}

function NotificationsTab() {
  return (
    <div>
      <h2 className="text-[28px] font-semibold text-text-primary">Notifications</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Choose what appears in the suite notification centre.</p>

      <ToggleRow label="New private posts" description="Notify for new private posts." defaultOn />
      <ToggleRow label="Mentions and replies" description="Notify when someone mentions or replies to you." defaultOn />
      <ToggleRow label="Digest summaries" description="Bundle low-priority activity into summaries." />
      <ToggleRow label="Delivery failure alerts" description="Alert when a post cannot reach its target relays." defaultOn />
    </div>
  );
}
