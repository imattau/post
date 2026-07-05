"use client";

import { useEffect, useState } from "react";
import { type ContactStatus, type ContactView, useContactsStore } from "@/lib/stores/contacts";
import { useSearchSimple } from "@/lib/useSearch";

type ContactsTab = "Overview" | "Following" | "Muted" | "Blocked";

const TABS: { icon: string; id: ContactsTab }[] = [
  { icon: "◎", id: "Overview" },
  { icon: "✓", id: "Following" },
  { icon: "–", id: "Muted" },
  { icon: "×", id: "Blocked" },
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
  const [selectedContact, setSelectedContact] = useState<ContactView | null>(null);
  const contacts = useContactsStore((s) => s.contacts);
  const loadContacts = useContactsStore((s) => s.loadContacts);
  const setStatus = useContactsStore((s) => s.setStatus);
  const { query: searchQuery, setQuery: setSearchQuery, results: searched } = useSearchSimple({
    items: contacts,
    fields: ["name", "handle", "npub", "pubkey"],
    debounceMs: 150,
  });

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  const stats = [
    { label: "Following", value: contacts.filter((contact) => contact.status === "Following").length },
    { label: "Muted", value: contacts.filter((contact) => contact.status === "Muted").length },
    { label: "Blocked", value: contacts.filter((contact) => contact.status === "Blocked").length },
    { label: "Groups", value: 0 },
  ];

  const updateStatus = async (contact: ContactView, status: ContactStatus) => {
    await setStatus(contact.id, status);
    setSelectedContact((current) => current?.id === contact.id ? { ...current, status } : current);
  };

  const filtered = searched.filter((c) => {
    if (activeTab === "Following" && c.status !== "Following") return false;
    if (activeTab === "Muted" && c.status !== "Muted") return false;
    if (activeTab === "Blocked" && c.status !== "Blocked") return false;
    return true;
  });

  return (
    <div className="flex-1 grid grid-cols-[248px_1fr] divide-x divide-border">
      {/* Sidebar */}
      <div className="bg-sidebar pl-6 pr-4 pt-4 pb-4">
        <div className="mb-5">
          <h1 className="text-text-near-white text-[21px] font-semibold">Contacts</h1>
        </div>
        <nav className="flex flex-col gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedContact(null); }}
              className={`flex items-center gap-3 h-10 pl-2 pr-3 rounded-[10px] transition-all duration-150 cursor-pointer ${
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

            {/* Stats cards — single card with 4 sections per Figma */}
            <div className="border border-border rounded-pill bg-sidebar p-6 flex justify-around mb-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-[28px] font-semibold text-text-primary">{stat.value}</p>
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
                  <button
                    onClick={(e) => { e.stopPropagation(); void updateStatus(contact, contact.status === "Muted" ? "Following" : "Muted"); }}
                    className="text-text-secondary text-[16px] font-semibold cursor-pointer hover:text-text-near-white"
                    aria-label={`Toggle mute ${contact.name}`}
                  >
                    ⋮
                  </button>
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
                      <button onClick={() => { void updateStatus(selectedContact, selectedContact.status === "Muted" ? "Following" : "Muted"); }} className="h-7 px-3 rounded-pill border border-border text-text-secondary text-[11px] font-medium cursor-pointer hover:border-brand/50 transition-all">
                        {selectedContact.status === "Muted" ? "Unmute" : "Mute"}
                      </button>
                      <button onClick={() => { void updateStatus(selectedContact, selectedContact.status === "Blocked" ? "Following" : "Blocked"); }} className="h-7 px-3 rounded-pill border border-border text-danger text-[11px] font-medium cursor-pointer hover:border-danger/50 transition-all">
                        {selectedContact.status === "Blocked" ? "Unblock" : "Block"}
                      </button>
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
                      <button
                        onClick={(e) => { e.stopPropagation(); void updateStatus(contact, contact.status === "Muted" ? "Following" : "Muted"); }}
                        className="text-text-secondary text-[16px] font-semibold cursor-pointer hover:text-text-near-white"
                        aria-label={`Toggle mute ${contact.name}`}
                      >
                        ⋮
                      </button>
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
