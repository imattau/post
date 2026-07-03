"use client";

import { useState } from "react";

type ContactsTab = "Overview" | "Following" | "Muted" | "Blocked";

const TABS: { icon: string; id: ContactsTab }[] = [
  { icon: "◎", id: "Overview" },
  { icon: "✓", id: "Following" },
  { icon: "–", id: "Muted" },
  { icon: "×", id: "Blocked" },
];

interface Contact {
  id: string;
  initials: string;
  name: string;
  handle: string;
  npub: string;
  bio: string;
  status: "Following" | "Muted" | "Blocked";
  timestamp: string;
  color: string;
}

const CONTACTS: Contact[] = [
  { id: "1", initials: "AL", name: "Alice Nguyen", handle: "@alice", npub: "npub1alice…x9k2", bio: "Designer · Melbourne", status: "Following", timestamp: "Today", color: "var(--color-avatar-1)" },
  { id: "2", initials: "JB", name: "Jonas Berg", handle: "@jonas", npub: "npub1jonas…m4p8", bio: "Relay developer · Oslo", status: "Following", timestamp: "Yesterday", color: "var(--color-avatar-2)" },
  { id: "3", initials: "NW", name: "Noise Watch", handle: "@noisewatch", npub: "npub1noise…j7h4", bio: "Photographer · Seoul", status: "Following", timestamp: "Friday", color: "var(--color-avatar-5)" },
  { id: "4", initials: "SP", name: "Spam Account", handle: "@fastprofit", npub: "npub1spam…z6n1", bio: "Product strategist · Madrid", status: "Following", timestamp: "Thursday", color: "var(--color-avatar-4)" },
  { id: "5", initials: "RM", name: "Relay Monitor", handle: "@relaymon", npub: "npub1relay…h7j3", bio: "Automated service identity", status: "Following", timestamp: "Wednesday", color: "var(--color-avatar-6)" },
];

const STATS = [
  { label: "Following", value: 328 },
  { label: "Muted", value: 14 },
  { label: "Blocked", value: 6 },
  { label: "Groups", value: 9 },
];

function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Following: "bg-surface-active border-brand text-brand-light",
    Muted: "bg-surface-active border-warn text-warn",
    Blocked: "bg-surface-active border-danger text-danger",
  };
  return (
    <span
      className={`h-7 px-3 rounded-pill text-[11px] font-medium border leading-[28px] ${styles[status] || styles.Following}`}
    >
      {status}
    </span>
  );
}

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState<ContactsTab>("Overview");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = CONTACTS.filter((c) => {
    if (activeTab === "Following" && c.status !== "Following") return false;
    if (activeTab === "Muted" && c.status !== "Muted") return false;
    if (activeTab === "Blocked" && c.status !== "Blocked") return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 grid grid-cols-[248px_1fr] divide-x divide-border">
      {/* Sidebar */}
      <div className="bg-sidebar p-4">
        <div className="mb-5">
          <h1 className="text-text-near-white text-[21px] font-semibold">Contacts</h1>
        </div>
        <nav className="flex flex-col gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedContact(null); }}
              className={`flex items-center gap-3 h-[38px] px-3 rounded-[10px] transition-all duration-150 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-surface-active text-white"
                  : "text-text-secondary hover:text-text-near-white hover:brightness-110"
              }`}
            >
              <span className="text-[15px]">{tab.icon}</span>
              <span className={`text-[13px] ${activeTab === tab.id ? "font-semibold" : "font-medium"}`}>
                {tab.id}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-canvas overflow-y-auto">
        {activeTab === "Overview" && !selectedContact && (
          <div className="p-8">
            <h2 className="text-[28px] font-semibold text-text-primary">Overview</h2>
            <p className="text-[11px] text-text-tertiary mt-1 mb-6">Summary stats and all contacts.</p>

            {/* Stats cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="border border-border rounded-pill bg-sidebar p-5 text-center"
                >
                  <p className="text-[28px] font-bold text-text-primary">{stat.value}</p>
                  <p className="text-[11px] text-text-tertiary mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 h-[42px] px-3 bg-sidebar border border-border rounded-pill max-w-md mb-4">
              <span className="text-text-tertiary text-[15px]">⌕</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts…"
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-text-primary placeholder-text-placeholder"
              />
            </div>

            {/* Contact list */}
            <div className="space-y-1">
              {filtered.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className="flex items-center gap-4 h-20 px-4 border border-border rounded-pill bg-sidebar cursor-pointer hover:brightness-110 transition-all duration-150"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: contact.color }}
                  >
                    <span className="text-white text-[11px] font-semibold">{contact.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-text-near-white">{contact.name}</span>
                      <span className="text-[11px] text-brand-light">{contact.handle}</span>
                    </div>
                    <p className="text-[10px] text-text-tertiary mt-0.5">{contact.npub}</p>
                    <p className="text-[10px] text-text-tertiary">{contact.bio}</p>
                  </div>
                  <StatusChip status={contact.status} />
                  <span className="text-[10px] text-text-tertiary flex-shrink-0 w-16 text-right">{contact.timestamp}</span>
                  <button className="text-text-secondary text-[16px] font-semibold cursor-pointer hover:text-text-near-white">⋮</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab !== "Overview" || selectedContact) && (
          <div className="p-8">
            {selectedContact ? (
              <>
                {/* Profile header */}
                <div className="flex items-center gap-5 mb-8 p-5 border border-border rounded-pill bg-sidebar max-w-xl">
                  <div
                    className="w-[88px] h-[88px] rounded-[18px] flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: selectedContact.color }}
                  >
                    <span className="text-white text-[25px] font-bold">{selectedContact.initials}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[18px] font-semibold text-text-primary">{selectedContact.name}</p>
                    <p className="text-[11px] text-brand-light">{selectedContact.handle}</p>
                    <p className="text-[10px] text-text-tertiary">{selectedContact.npub}</p>
                    <div className="flex gap-2 mt-2">
                      <StatusChip status={selectedContact.status} />
                      <button className="h-7 px-3 rounded-pill border border-border text-text-secondary text-[11px] font-medium cursor-pointer hover:border-brand/50 transition-all">Mute</button>
                      <button className="h-7 px-3 rounded-pill border border-border text-danger text-[11px] font-medium cursor-pointer hover:border-danger/50 transition-all">Block</button>
                    </div>
                  </div>
                </div>

                {/* Message timeline */}
                <div className="border border-border rounded-pill bg-sidebar p-6 text-center max-w-xl">
                  <p className="text-text-tertiary text-[13px]">Message history will appear here</p>
                </div>

                <button
                  onClick={() => setSelectedContact(null)}
                  className="mt-4 text-[12px] font-medium text-brand-light cursor-pointer hover:brightness-110"
                >
                  ← Back to contacts
                </button>
              </>
            ) : (
              <>
                <h2 className="text-[26px] font-semibold text-text-primary">{activeTab}</h2>
                <p className="text-[11px] text-text-tertiary mt-1 mb-6">
                  {activeTab === "Following" && "People and identities currently in your contact list."}
                  {activeTab === "Muted" && "Muted people can still message you. Their activity is hidden from notifications."}
                  {activeTab === "Blocked" && "Blocked identities."}
                </p>

                <div className="space-y-1">
                  {filtered.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className="flex items-center gap-4 h-20 px-4 border border-border rounded-pill bg-sidebar cursor-pointer hover:brightness-110 transition-all duration-150"
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: contact.color }}
                      >
                        <span className="text-white text-[11px] font-semibold">{contact.initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-text-near-white">{contact.name}</span>
                          <span className="text-[11px] text-brand-light">{contact.handle}</span>
                        </div>
                        <p className="text-[10px] text-text-tertiary mt-0.5">{contact.npub}</p>
                        <p className="text-[10px] text-text-tertiary">{contact.bio}</p>
                      </div>
                      <StatusChip status={contact.status} />
                      <span className="text-[10px] text-text-tertiary flex-shrink-0 w-16 text-right">{contact.timestamp}</span>
                      <button className="text-text-secondary text-[16px] font-semibold cursor-pointer hover:text-text-near-white">⋮</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
