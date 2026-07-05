"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchSimple } from "@/lib/useSearch";
import { resolveNip05 } from "@post/nostr-core";
import { useIdentityStore } from "@/lib/stores/identity";
import { useRelaysStore } from "@/lib/stores/relays";
import { useSettingsStore, SETTING_DEFAULTS, type SettingKey } from "@/lib/stores/settings";
import { db } from "@/lib/db/schema";
import IdentityDialog from "@/components/IdentityDialog";

type SubCategory = { id: string; label: string };
type Category = { id: string; icon: string; label: string; subCategories: SubCategory[] };

const CATEGORIES: Category[] = [
  {
    id: "Account", icon: "◎", label: "Account",
    subCategories: [
      { id: "Profile", label: "Profile" },
      { id: "Identity-signing", label: "Identity & signing" },
      { id: "Sessions", label: "Sessions" },
      { id: "Recovery", label: "Recovery" },
    ],
  },
  {
    id: "General", icon: "⌘", label: "General",
    subCategories: [
      { id: "Compose", label: "Compose" },
      { id: "Reading", label: "Reading" },
    ],
  },
  {
    id: "Post", icon: "P", label: "Post",
    subCategories: [
      { id: "Compose-replies", label: "Compose & replies" },
      { id: "Post-Reading", label: "Reading" },
      { id: "Folders-labels", label: "Folders & labels" },
      { id: "Signatures", label: "Signatures" },
      { id: "Rules", label: "Rules" },
    ],
  },
  {
    id: "Drive", icon: "D", label: "Drive",
    subCategories: [
      { id: "Storage", label: "Storage" },
      { id: "Uploads", label: "Uploads" },
      { id: "Sharing", label: "Sharing" },
      { id: "Offline-files", label: "Offline files" },
      { id: "Versions", label: "Versions" },
    ],
  },
  {
    id: "Calendar", icon: "C", label: "Calendar",
    subCategories: [
      { id: "Cal-General", label: "General" },
      { id: "Cal-Appearance", label: "Appearance" },
      { id: "Cal-Notifications", label: "Notifications" },
      { id: "Cal-Sync", label: "Sync" },
    ],
  },
  {
    id: "Notes", icon: "N", label: "Notes",
    subCategories: [{ id: "Notes-General", label: "General" }],
  },
  {
    id: "Notifications", icon: "●", label: "Notifications",
    subCategories: [{ id: "Notifications", label: "Notifications" }],
  },
  {
    id: "Appearance", icon: "◐", label: "Appearance",
    subCategories: [{ id: "Appearance", label: "Appearance" }],
  },
  {
    id: "Privacy-security", icon: "◆", label: "Privacy & security",
    subCategories: [{ id: "Privacy-security", label: "Privacy & security" }],
  },
  {
    id: "Relays-network", icon: "◉", label: "Relays & network",
    subCategories: [{ id: "Relays-network", label: "Relays & network" }],
  },
  {
    id: "Advanced", icon: "⋯", label: "Advanced",
    subCategories: [{ id: "Advanced", label: "Advanced" }],
  },
];

function ToggleRow({ settingKey, label, description, defaultOn }: { settingKey: SettingKey; label: string; description: string; defaultOn?: boolean }) {
  const value = useSettingsStore((s) => s.values[settingKey]);
  const setValue = useSettingsStore((s) => s.setValue);
  const fallback = defaultOn ?? (SETTING_DEFAULTS[settingKey] as boolean | undefined) ?? false;
  const on = typeof value === "boolean" ? value : fallback;
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 pr-4">
        <p className="text-[14px] font-medium text-text-primary">{label}</p>
        <p className="text-[11px] text-text-tertiary mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => setValue(settingKey, !on)}
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
  return <h3 className="text-[15px] font-semibold text-text-primary mt-8 mb-4">{title}</h3>;
}

function SelectRow({ settingKey, label, description, options, defaultValue }: { settingKey: SettingKey; label: string; description: string; options: { value: string; label: string }[]; defaultValue?: string }) {
  const value = useSettingsStore((s) => s.values[settingKey]);
  const setValue = useSettingsStore((s) => s.setValue);
  const fallback = defaultValue ?? (SETTING_DEFAULTS[settingKey] as string | undefined) ?? "";
  const current = typeof value === "string" ? value : fallback;
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 pr-4">
        <p className="text-[14px] font-medium text-text-primary">{label}</p>
        <p className="text-[11px] text-text-tertiary mt-0.5">{description}</p>
      </div>
      <select
        value={current}
        onChange={(e) => setValue(settingKey, e.target.value)}
        className="h-9 px-3 rounded-[10px] bg-pill-subtle border border-border text-text-secondary text-[11px] font-medium text-center appearance-none cursor-pointer hover:brightness-110 transition-all flex-shrink-0"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function SubNav({ category, activeSub, onSelect }: { category: Category; activeSub: string; onSelect: (id: string) => void }) {
  return (
    <div className="pt-[30px] px-4">
      <h3 className="text-[18px] font-semibold text-text-near-white mb-6">{category.label}</h3>
      <div className="flex flex-col gap-[2px]">
        {category.subCategories.map((sub) => (
          <button
            key={sub.id}
            onClick={() => onSelect(sub.id)}
            className={`w-full h-[38px] px-3 rounded-[10px] text-left text-[12px] font-medium transition-all duration-150 cursor-pointer ${
              activeSub === sub.id
                ? "bg-surface-active text-white"
                : "text-text-secondary hover:text-text-near-white"
            }`}
          >
            {sub.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState("Account");
  const [activeSubCategory, setActiveSubCategory] = useState("Profile");
  const [identityOpen, setIdentityOpen] = useState(false);
  const router = useRouter();
  const identity = useIdentityStore((s) => s.identity);

  const category = CATEGORIES.find((c) => c.id === activeCategory) ?? CATEGORIES[0];

  const { query: searchQuery, setQuery: setSearchQuery, results: filteredCategories } = useSearchSimple({
    items: CATEGORIES.map((cat) => ({
      ...cat,
      _subLabels: cat.subCategories.map((s) => s.label).join(" "),
    })),
    fields: ["label", "_subLabels"],
    debounceMs: 100,
  });

  const switchCategory = (catId: string) => {
    setActiveCategory(catId);
    const cat = CATEGORIES.find((c) => c.id === catId);
    if (cat) setActiveSubCategory(cat.subCategories[0].id);
  };

  const initials = identity?.profile?.displayName?.slice(0, 2).toUpperCase() ?? identity?.npub?.slice(5, 7).toUpperCase() ?? "?";
  const shortNpub = identity?.npub ? `npub1${identity.npub.slice(5, 9)}…${identity.npub.slice(-4)}` : "No identity loaded";

  const content = (() => {
    switch (activeSubCategory) {
      case "Profile": return <ProfileContent />;
      case "Identity-signing": return <IdentitySigningContent router={router} />;
      case "Sessions": return <SessionsContent />;
      case "Recovery": return <RecoveryContent />;
      case "Compose": return <GeneralComposeContent />;
      case "Reading": return <GeneralReadingContent />;
      case "Compose-replies": return <PostComposeRepliesContent />;
      case "Post-Reading": return <PostReadingContent />;
      case "Folders-labels": return <FoldersLabelsContent />;
      case "Signatures": return <PostSignaturesContent />;
      case "Rules": return <RulesContent />;
      case "Storage": return <DriveStorageContent />;
      case "Uploads": return <DriveUploadsContent />;
      case "Sharing": return <DriveSharingContent />;
      case "Offline-files": return <DriveOfflineContent />;
      case "Versions": return <DriveVersionsContent />;
      case "Cal-General": return <CalGeneralContent />;
      case "Cal-Appearance": return <CalAppearanceContent />;
      case "Cal-Notifications": return <CalNotificationsContent />;
      case "Cal-Sync": return <CalSyncContent />;
      case "Notes-General": return <NotesGeneralContent />;
      case "Notifications": return <NotificationsContent />;
      case "Appearance": return <AppearanceContent />;
      case "Privacy-security": return <PrivacyContent />;
      case "Relays-network": return <RelaysContent />;
      case "Advanced": return <AdvancedContent />;
      default: return <ProfileContent />;
    }
  })();

  return (
    <div className="flex-1 grid grid-cols-[300px_1fr] lg:grid-cols-[300px_248px_1fr] divide-x divide-border">
      {/* Column 1: Category nav */}
      <div className="bg-pill-subtle pl-6 pr-4 pt-4 pb-4 flex flex-col h-full overflow-hidden">
        <h1 className="text-text-near-white text-[24px] font-semibold mb-5">Settings</h1>
        <div className="flex items-center gap-2 h-10 px-3 bg-dock border border-border rounded-[10px] mb-4 flex-shrink-0">
          <span className="text-text-secondary text-[14px]">⌕</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings"
            className="flex-1 bg-transparent border-none outline-none text-[12px] text-text-primary placeholder-text-placeholder"
          />
        </div>
        <nav className="flex-1 overflow-y-auto space-y-[2px] min-h-0">
          {filteredCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => switchCategory(cat.id)}
              className={`w-full flex items-center gap-3 h-[42px] px-2 rounded-[10px] text-left transition-all duration-150 cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-surface-active text-white"
                  : "text-text-secondary hover:text-text-near-white hover:brightness-110"
              }`}
            >
              <span className="text-[15px] w-5 text-center">{cat.icon}</span>
              <span className={`text-[13px] ${activeCategory === cat.id ? "font-semibold" : "font-medium"}`}>
                {cat.label}
              </span>
            </button>
          ))}
        </nav>
        {/* Profile card */}
        <div className="flex-shrink-0 mt-4 flex items-center gap-3 p-3 border border-border rounded-tile bg-dock">
          <div className="w-[34px] h-[34px] rounded-full bg-avatar-6 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-semibold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-text-primary truncate">{identity?.profile?.displayName || identity?.profile?.name || "Local identity"}</p>
            <p className="text-[10px] text-text-tertiary truncate">{shortNpub}</p>
          </div>
          <button
            onClick={() => setIdentityOpen(true)}
            className="text-[10px] font-medium text-brand-light hover:brightness-110 cursor-pointer flex-shrink-0"
          >
            Manage
          </button>
        </div>
      </div>

      {/* Column 2: Sub-nav */}
      <div className="bg-dock overflow-y-auto hidden lg:block">
        <SubNav category={category} activeSub={activeSubCategory} onSelect={setActiveSubCategory} />
      </div>

      {/* Column 3: Content */}
      <div className="bg-canvas overflow-y-auto p-8">
        {content}
      </div>

      {identityOpen && <IdentityDialog onClose={() => setIdentityOpen(false)} />}
    </div>
  );
}

/* ───── Account ───── */

function ProfileContent() {
  const identity = useIdentityStore((s) => s.identity);
  const initials = identity?.profile?.displayName?.slice(0, 2).toUpperCase() ?? identity?.npub?.slice(5, 7).toUpperCase() ?? "?";
  const displayName = identity?.profile?.displayName || identity?.profile?.name || "Local identity";
  const handle = identity?.nip05 || "No NIP-05";
  const shortNpub = identity?.npub ? `npub1${identity.npub.slice(5, 9)}…${identity.npub.slice(-4)}` : "";

  const exportSettings = async () => {
    const relays = useRelaysStore.getState().relays;
    const payload = JSON.stringify({ settings: useSettingsStore.getState().values, relays }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "post-settings-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Profile</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Manage your shared identity and profile across the suite.</p>

      <SectionHeader title="Suite identity" />
      <hr className="border-border mb-5" />
      <div className="flex items-center gap-5 mb-6">
        <div className="w-[72px] h-[72px] rounded-full bg-avatar-6 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[20px] font-semibold">{initials}</span>
        </div>
        <div className="flex-1">
          <p className="text-[18px] font-semibold text-text-primary">{displayName}</p>
          <p className="text-[14px] font-medium text-brand-light mt-0.5">@{handle}</p>
          <p className="text-[11px] text-text-tertiary mt-1">{shortNpub}</p>
          <p className="text-[11px] text-text-tertiary">Used by Post, Drive, Calendar and Notes</p>
        </div>
        <button className="h-[38px] px-4 rounded-[10px] bg-pill-subtle border border-border text-text-secondary text-[11px] font-medium cursor-pointer hover:brightness-110 transition-all flex-shrink-0">
          Edit profile
        </button>
      </div>

      <SectionHeader title="Account preferences" />
      <hr className="border-border mb-2" />
      <SelectRow
        settingKey="default-start-app"
        label="Default start app"
        description="Open this app when the suite launches."
        options={[
          { value: "post", label: "Post" },
          { value: "drive", label: "Drive" },
          { value: "calendar", label: "Calendar" },
          { value: "notes", label: "Notes" },
        ]}
        defaultValue="post"
      />
      <hr className="border-border" />
      <ToggleRow settingKey="cross-app-search" label="Cross-app search" description="Include messages, files, events and notes in unified search." defaultOn />
      <hr className="border-border" />
      <ToggleRow settingKey="account-switching" label="Account switching" description="Show the identity switcher in every app." defaultOn />

      <SectionHeader title="Data and portability" />
      <hr className="border-border mb-2" />
      <div className="flex items-center justify-between py-3">
        <div className="flex-1 pr-4">
          <p className="text-[14px] font-medium text-text-primary">Export suite settings</p>
          <p className="text-[11px] text-text-tertiary mt-0.5">Download preferences, relay lists and app configuration.</p>
        </div>
        <button onClick={exportSettings} className="h-9 px-4 rounded-[10px] bg-pill-subtle border border-border text-text-secondary text-[11px] font-medium cursor-pointer hover:brightness-110 transition-all flex-shrink-0">
          Export
        </button>
      </div>
      <hr className="border-border" />
      <div className="flex items-center justify-between py-3">
        <div className="flex-1 pr-4">
          <p className="text-[14px] font-medium text-text-primary">Sign out everywhere</p>
          <p className="text-[11px] text-text-tertiary mt-0.5">End sessions on all devices connected to this identity.</p>
        </div>
        <button className="h-9 px-4 rounded-[10px] bg-pill-subtle border border-border text-text-secondary text-[11px] font-medium cursor-pointer hover:brightness-110 transition-all flex-shrink-0">
          Manage sessions
        </button>
      </div>
    </>
  );
}

function IdentitySigningContent({ router }: { router: ReturnType<typeof useRouter> }) {
  const identity = useIdentityStore((s) => s.identity);
  const usingNip07 = useIdentityStore((s) => s.usingNip07);
  const connectNip07 = useIdentityStore((s) => s.connectNip07);
  const createOrImport = useIdentityStore((s) => s.createOrImport);
  const logout = useIdentityStore((s) => s.logout);
  const [nip05, setNip05] = useState(identity?.nip05 ?? "");
  const [verifyStatus, setVerifyStatus] = useState("");
  const initials = identity?.profile?.displayName?.slice(0, 2).toUpperCase() ?? identity?.npub?.slice(5, 7).toUpperCase() ?? "?";

  const verifyNip05 = async () => {
    if (!nip05.trim()) return;
    const result = await resolveNip05(nip05.trim());
    setVerifyStatus(result?.pubkey === identity?.pubkey ? "Verified" : "No match");
  };

  const exportIdentity = () => {
    if (!identity?.nsec) return;
    const blob = new Blob([identity.nsec], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nostr-nsec-backup.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Identity & signing</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Manage your Nostr identity keys and signing method.</p>

      <SectionHeader title="Current Identity" />
      <div className="flex items-center gap-5 p-4 border border-border rounded-pill bg-pill-subtle max-w-lg">
        <div className="w-[88px] h-[88px] rounded-[18px] bg-pill-subtle flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[25px] font-semibold">{initials}</span>
        </div>
        <div>
          <p className="text-[18px] font-semibold text-text-primary">{identity?.profile?.displayName || identity?.profile?.name || "Local identity"}</p>
          <p className="text-[11px] text-brand-light">{identity?.nip05 ?? "No NIP-05"}</p>
          <p className="text-[10px] text-text-tertiary">{identity?.npub ?? "No identity loaded"}</p>
        </div>
      </div>

      <SectionHeader title="NIP-05" />
      <div className="flex items-center gap-2 max-w-lg">
        <input
          type="text"
          value={nip05}
          onChange={(e) => { setNip05(e.target.value); setVerifyStatus(""); }}
          placeholder="alice@example.com"
          className="flex-1 h-9 px-3 text-[13px] bg-pill-subtle border border-border rounded-pill text-text-primary placeholder-text-placeholder outline-none"
        />
        <button onClick={verifyNip05} className="h-9 px-4 rounded-pill bg-brand text-white text-[12px] font-semibold cursor-pointer hover:brightness-110">Verify</button>
      </div>
      {verifyStatus && <p className="mt-2 text-[11px] text-text-tertiary">{verifyStatus}</p>}

      <SectionHeader title="Signing Method" />
      <div className="flex gap-2 max-w-lg">
        {["NIP-07 Extension", "Local Key Store", "NIP-46 Bunker"].map((method) => (
          <button
            key={method}
            onClick={() => {
              if (method === "NIP-07 Extension") void connectNip07();
              if (method === "Local Key Store") void createOrImport();
            }}
            disabled={method === "NIP-46 Bunker"}
            className={`h-9 px-4 rounded-pill text-[12px] font-medium border cursor-pointer transition-all ${
              (method === "NIP-07 Extension" && usingNip07) || (method === "Local Key Store" && !usingNip07)
                ? "bg-surface-active border-brand text-brand-light"
                : method === "NIP-46 Bunker"
                  ? "bg-pill-subtle border-border text-text-tertiary opacity-50 cursor-not-allowed"
                  : "bg-pill-subtle border-border text-text-secondary hover:border-brand/50"
            }`}
          >
            {method}
          </button>
        ))}
      </div>

      <SectionHeader title="Export Identity" />
      <button onClick={exportIdentity} disabled={!identity?.nsec} className="h-9 px-4 rounded-pill bg-pill-subtle border border-border text-text-secondary text-[12px] font-medium cursor-pointer hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
        Identity backup.txt
      </button>

      <hr className="mt-8 border-border" />
      <button onClick={() => { logout(); router.push("/login"); }} className="mt-6 h-9 px-4 rounded-pill bg-danger/10 border border-danger/30 text-danger text-[12px] font-semibold cursor-pointer hover:bg-danger/20 transition-all">
        Sign out
      </button>
    </>
  );
}

function SessionsContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Sessions</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Devices and clients connected to your identity.</p>
      <div className="border border-border rounded-pill bg-pill-subtle p-6 text-center max-w-lg">
        <p className="text-text-tertiary text-[13px]">Session management coming soon</p>
      </div>
    </>
  );
}

function RecoveryContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Recovery</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Backup and recovery options for your identity.</p>
      <div className="border border-border rounded-pill bg-pill-subtle p-6 text-center max-w-lg">
        <p className="text-text-tertiary text-[13px]">Recovery options coming soon</p>
      </div>
    </>
  );
}

/* ───── General ───── */

function GeneralComposeContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Compose</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Control how new posts and drafts behave.</p>
      <SelectRow
        settingKey="default-post-visibility"
        label="Default post visibility"
        description="Choose how new posts begin before sending."
        options={[
          { value: "public", label: "Public" },
          { value: "private", label: "Private" },
          { value: "group", label: "Group" },
          { value: "last", label: "Last used" },
        ]}
        defaultValue="last"
      />
      <hr className="border-border" />
      <ToggleRow settingKey="encrypt-direct-posts" label="Encrypt direct posts" description="Use supported encryption automatically for direct posts." defaultOn />
      <hr className="border-border" />
      <ToggleRow settingKey="autosave-drafts" label="Autosave drafts" description="Save drafts locally and sync encrypted copies." defaultOn />
      <hr className="border-border" />
      <ToggleRow settingKey="relay-delivery-preview" label="Show relay delivery preview" description="Display target relays before publishing." defaultOn />
    </>
  );
}

function GeneralReadingContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Reading</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Customise how posts appear when reading.</p>
      <ToggleRow settingKey="built-in-reader" label="Use built-in reader" description="Use the built-in reader where possible." defaultOn />
      <hr className="border-border" />
      <ToggleRow settingKey="reply-same-format" label="Reply in the same format" description="Preserve private, public or group visibility when replying." defaultOn />
      <hr className="border-border" />
      <ToggleRow settingKey="quote-original-post" label="Quote original post" description="Include quoted context when replying." />
    </>
  );
}

/* ───── Post ───── */

function PostComposeRepliesContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Compose & replies</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Control how new posts, replies and drafts behave.</p>

      <SectionHeader title="Compose" />
      <hr className="border-border mb-2" />
      <SelectRow
        settingKey="default-post-visibility"
        label="Default post visibility"
        description="Choose how new posts begin before sending."
        options={[
          { value: "public", label: "Public" },
          { value: "private", label: "Private" },
          { value: "group", label: "Group" },
          { value: "last", label: "Last used" },
        ]}
        defaultValue="last"
      />
      <hr className="border-border" />
      <ToggleRow settingKey="encrypt-direct-posts" label="Encrypt direct posts" description="Use supported encryption automatically for direct posts." defaultOn />
      <hr className="border-border" />
      <ToggleRow settingKey="autosave-drafts" label="Autosave drafts" description="Save drafts locally and sync encrypted copies." defaultOn />
      <hr className="border-border" />
      <ToggleRow settingKey="relay-delivery-preview" label="Show relay delivery preview" description="Display target relays before publishing." defaultOn />

      <SectionHeader title="Replies" />
      <hr className="border-border mb-2" />
      <ToggleRow settingKey="reply-same-format" label="Reply in the same format" description="Preserve private, public or group visibility." defaultOn />
      <hr className="border-border" />
      <ToggleRow settingKey="quote-original-post" label="Quote original post" description="Include quoted context when replying." />

      <SectionHeader title="Signatures" />
      <hr className="border-border mb-2" />
      <SelectRow
        settingKey="default-signature"
        label="Default signature"
        description="Append a selected signature to new posts."
        options={[{ value: "none", label: "None" }]}
        defaultValue="none"
      />
    </>
  );
}

function PostReadingContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Reading</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Customise how posts appear when reading.</p>
      <ToggleRow settingKey="show-images-inline" label="Show images inline" description="Display image attachments directly in the post." defaultOn />
      <hr className="border-border" />
      <ToggleRow settingKey="mark-read-scroll" label="Mark as read on scroll" description="Automatically mark posts as read when scrolling past them." defaultOn />
    </>
  );
}

function FoldersLabelsContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Folders & labels</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Organise posts by folder or label.</p>
      <div className="border border-border rounded-pill bg-pill-subtle p-6 text-center max-w-lg">
        <p className="text-text-tertiary text-[13px]">Label management coming soon</p>
      </div>
    </>
  );
}

function PostSignaturesContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Signatures</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Manage signatures appended to your posts.</p>
      <SelectRow
        settingKey="default-signature"
        label="Default signature"
        description="Append a selected signature to new posts."
        options={[{ value: "none", label: "None" }]}
        defaultValue="none"
      />
      <hr className="border-border" />
      <div className="border border-border rounded-pill bg-pill-subtle p-6 text-center max-w-lg mt-6">
        <p className="text-text-tertiary text-[13px]">Signature editor coming soon</p>
      </div>
    </>
  );
}

function RulesContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Rules</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Automate actions based on post conditions.</p>
      <div className="border border-border rounded-pill bg-pill-subtle p-6 text-center max-w-lg">
        <p className="text-text-tertiary text-[13px]">Rules coming soon</p>
      </div>
    </>
  );
}

/* ───── Drive ───── */

function DriveStorageContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Storage</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Manage providers, replicas, cache and upload behaviour.</p>

      <SectionHeader title="Storage usage" />
      <hr className="border-border mb-4" />
      <div className="border border-border rounded-[14px] bg-pill-subtle p-5 max-w-lg">
        <p className="text-[14px] font-semibold text-text-primary">18.4 GB of 30 GB used</p>
        <div className="mt-4 w-full h-2 bg-dock rounded-[4px]">
          <div className="w-[60%] h-full bg-brand rounded-[4px]" />
        </div>
        <p className="mt-3 text-[10px] text-text-tertiary">Blossom 12.2 GB · Local cache 4.8 GB · Vault 1.4 GB</p>
      </div>
    </>
  );
}

function DriveUploadsContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Uploads</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Configure upload behaviour and encryption.</p>
      <ToggleRow settingKey="encrypt-private-uploads" label="Encrypt private uploads" description="Encrypt files before sending them to storage providers." defaultOn />
      <hr className="border-border" />
      <div className="flex items-center justify-between py-3">
        <div className="flex-1 pr-4">
          <p className="text-[14px] font-medium text-text-primary">Replication target</p>
          <p className="text-[11px] text-text-tertiary mt-0.5">Store each file across multiple healthy providers.</p>
        </div>
        <button className="h-9 px-4 rounded-[10px] bg-pill-subtle border border-border text-text-secondary text-[11px] font-medium cursor-pointer hover:brightness-110 transition-all flex-shrink-0">
          3 providers
        </button>
      </div>
      <hr className="border-border" />
      <ToggleRow settingKey="background-uploads" label="Background uploads" description="Continue uploading files when the app is minimised." defaultOn />
    </>
  );
}

function DriveSharingContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Sharing</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Default permissions for shared files and folders.</p>
      <SelectRow
        settingKey="default-share-permission"
        label="Default share permission"
        description="Choose the default access level when sharing."
        options={[
          { value: "read", label: "Read only" },
          { value: "write", label: "Read & write" },
        ]}
        defaultValue="read"
      />
    </>
  );
}

function DriveOfflineContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Offline files</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Manage files available offline.</p>
      <ToggleRow settingKey="enable-offline-files" label="Enable offline access" description="Keep frequently used files available offline." defaultOn />
      <hr className="border-border" />
      <div className="border border-border rounded-pill bg-pill-subtle p-6 text-center max-w-lg mt-4">
        <p className="text-text-tertiary text-[13px]">0 files cached for offline use</p>
      </div>
    </>
  );
}

function DriveVersionsContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Versions</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Version history for files in Drive.</p>
      <ToggleRow settingKey="enable-file-versions" label="Enable version history" description="Keep previous versions of files when they are updated." defaultOn />
      <hr className="border-border" />
      <SelectRow
        settingKey="version-retention"
        label="Version retention"
        description="How long to keep old file versions."
        options={[
          { value: "30", label: "30 days" },
          { value: "90", label: "90 days" },
          { value: "365", label: "1 year" },
          { value: "forever", label: "Forever" },
        ]}
        defaultValue="90"
      />
    </>
  );
}

/* ───── Calendar ───── */

function CalGeneralContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Calendar</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Configure relays, visibility and default behaviour.</p>

      <SectionHeader title="Calendar visibility" />
      <hr className="border-border mb-4" />
      <div className="border border-border rounded-[14px] bg-pill-subtle p-6 text-center max-w-lg">
        <p className="text-text-tertiary text-[13px]">Calendar visibility settings integrated from calendar settings page.</p>
      </div>
    </>
  );
}

function CalAppearanceContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Appearance</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Customise how your calendar looks.</p>
      <SelectRow
        settingKey="week-start-day"
        label="Week starts on"
        description="Choose the first day of the week."
        options={[
          { value: "monday", label: "Monday" },
          { value: "sunday", label: "Sunday" },
          { value: "saturday", label: "Saturday" },
        ]}
        defaultValue="monday"
      />
      <hr className="border-border" />
      <SelectRow
        settingKey="default-calendar-view"
        label="Default view"
        description="Choose the default calendar view."
        options={[
          { value: "month", label: "Month" },
          { value: "week", label: "Week" },
          { value: "agenda", label: "Agenda" },
        ]}
        defaultValue="month"
      />
      <hr className="border-border" />
      <ToggleRow settingKey="show-weekends" label="Show weekends" description="Display Saturday and Sunday in the calendar." defaultOn />
    </>
  );
}

function CalNotificationsContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Notifications</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Control calendar-related notifications.</p>
      <ToggleRow settingKey="notify-event-reminders" label="Event reminders" description="Show reminders for upcoming events." defaultOn />
      <hr className="border-border" />
      <ToggleRow settingKey="notify-invitations" label="Invitation notifications" description="Notify when you receive a calendar invitation." defaultOn />
      <hr className="border-border" />
      <ToggleRow settingKey="notify-calendar-changes" label="Calendar changes" description="Notify when shared calendars are updated." />
    </>
  );
}

function CalSyncContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Sync</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Calendar sync status and configuration.</p>
      <div className="grid gap-3 max-w-lg mb-6">
        <div className="rounded-tile border border-border bg-pill-subtle p-4">
          <p className="text-[11px] text-text-tertiary">Sync status</p>
          <p className="mt-1 text-[20px] font-semibold text-text-near-white">Healthy</p>
        </div>
      </div>
      <ToggleRow settingKey="automatic-calendar-sync" label="Automatic sync" description="Keep calendars in sync across devices automatically." defaultOn />
    </>
  );
}

/* ───── Notes ───── */

function NotesGeneralContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Notes</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Configure notes app behaviour.</p>
      <SelectRow
        settingKey="notes-default-view"
        label="Default view"
        description="Choose the default view for notes."
        options={[
          { value: "grid", label: "Grid" },
          { value: "list", label: "List" },
        ]}
        defaultValue="grid"
      />
      <hr className="border-border" />
      <SelectRow
        settingKey="notes-sort-order"
        label="Sort order"
        description="Choose how notes are sorted."
        options={[
          { value: "updated", label: "Last updated" },
          { value: "created", label: "Date created" },
          { value: "title", label: "Title" },
        ]}
        defaultValue="updated"
      />
      <hr className="border-border" />
      <ToggleRow settingKey="notes-encrypt-default" label="Encrypt by default" description="Encrypt new notes by default." defaultOn />
    </>
  );
}

/* ───── Notifications ───── */

function NotificationsContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Notifications</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Choose what appears in the suite notification centre.</p>
      <ToggleRow settingKey="notify-private-posts" label="New private posts" description="Notify for new private posts." defaultOn />
      <hr className="border-border" />
      <ToggleRow settingKey="notify-mentions" label="Mentions and replies" description="Notify when someone mentions or replies to you." defaultOn />
      <hr className="border-border" />
      <ToggleRow settingKey="notify-digests" label="Digest summaries" description="Bundle low-priority activity into summaries." />
      <hr className="border-border" />
      <ToggleRow settingKey="notify-delivery-failures" label="Delivery failure alerts" description="Alert when a post cannot reach its target relays." defaultOn />
    </>
  );
}

/* ───── Appearance ───── */

function AppearanceContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Appearance</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Customise the look and feel of the suite.</p>
      <SelectRow
        settingKey="theme"
        label="Theme"
        description="Choose between light and dark mode."
        options={[
          { value: "dark", label: "Dark" },
          { value: "light", label: "Light" },
          { value: "system", label: "System" },
        ]}
        defaultValue="dark"
      />
      <hr className="border-border" />
      <SelectRow
        settingKey="density"
        label="Density"
        description="Control spacing and compactness of the UI."
        options={[
          { value: "comfortable", label: "Comfortable" },
          { value: "compact", label: "Compact" },
        ]}
        defaultValue="comfortable"
      />
      <hr className="border-border" />
      <ToggleRow settingKey="show-avatar-previews" label="Show avatar previews" description="Display sender avatars in message lists." defaultOn />
    </>
  );
}

/* ───── Privacy & security ───── */

function PrivacyContent() {
  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Privacy & security</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Encryption, metadata exposure and local data controls.</p>
      <ToggleRow settingKey="encrypt-direct-posts" label="Encrypt direct posts" description="Use supported Nostr encryption for private communication." defaultOn />
      <hr className="border-border" />
      <ToggleRow settingKey="encrypt-attachments" label="Encrypt attachments" description="Encrypt files before uploading to Drive or Blossom." defaultOn />
      <hr className="border-border" />
      <ToggleRow settingKey="hide-notification-content" label="Hide notification content" description="Do not show content in desktop notifications." />
    </>
  );
}

/* ───── Relays & network ───── */

function RelaysContent() {
  const relays = useRelaysStore((s) => s.relays);
  const statuses = useRelaysStore((s) => s.statuses);
  const addRelay = useRelaysStore((s) => s.addRelay);
  const removeRelay = useRelaysStore((s) => s.removeRelay);
  const connect = useRelaysStore((s) => s.connect);
  const [relayUrl, setRelayUrl] = useState("");

  const addRelayUrl = async () => {
    if (!relayUrl.trim()) return;
    addRelay({ url: relayUrl.trim(), read: true, write: true });
    setRelayUrl("");
    await connect();
  };

  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Relays & network</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Control how the suite discovers, publishes and retrieves events.</p>

      <ToggleRow settingKey="automatic-relay-selection" label="Automatic relay selection" description="Use contact lists and event hints to select relays." defaultOn />
      <hr className="border-border" />
      <div className="flex items-center justify-between py-3">
        <div className="flex-1 pr-4">
          <p className="text-[14px] font-medium text-text-primary">Minimum relay count</p>
          <p className="text-[11px] text-text-tertiary mt-0.5">Send private posts to at least three healthy relays.</p>
        </div>
        <span className="h-[26px] px-3 rounded-pill border border-border text-text-secondary text-[11px] font-medium leading-[26px]">3 relays</span>
      </div>

      <SectionHeader title="Connected Relays" />
      <div className="space-y-1 max-w-lg">
        {relays.map((relay) => (
          <div
            key={relay.url}
            className="group flex items-center gap-3 h-10 px-3 rounded-[8px] hover:bg-pill-subtle/60 transition-colors"
          >
            <div className={`w-2 h-2 rounded-full ${statuses[relay.url]?.connected ? "bg-ok" : "bg-text-tertiary"}`} />
            <span className="flex-1 text-[13px] text-text-primary">{relay.url}</span>
            <span className="text-[10px] text-text-tertiary">{statuses[relay.url]?.latency ? `${statuses[relay.url].latency}ms` : "—"}</span>
            <button onClick={async () => { removeRelay(relay.url); await connect(); }} className="text-[10px] text-danger hover:brightness-110 cursor-pointer hidden group-hover:block">Remove</button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 max-w-lg">
        <input
          type="text"
          value={relayUrl}
          onChange={(e) => setRelayUrl(e.target.value)}
          placeholder="wss://relay.example.com"
          className="flex-1 h-9 px-3 text-[13px] bg-pill-subtle border border-border rounded-pill text-text-primary placeholder-text-placeholder outline-none"
        />
        <button onClick={addRelayUrl} className="h-9 px-4 rounded-pill bg-brand text-white text-[12px] font-semibold cursor-pointer hover:brightness-110">Add</button>
      </div>

      <SectionHeader title="Delivery" />
      <hr className="border-border mb-2" />
      <ToggleRow settingKey="relay-delivery-preview" label="Show relay delivery preview" description="Display the relay set before sending." defaultOn />
      <hr className="border-border" />
      <ToggleRow settingKey="download-profile-metadata" label="Download profile metadata" description="Download profile metadata, relay list and contact graph." defaultOn />
      <hr className="border-border" />
      <ToggleRow settingKey="prefer-recipient-relays" label="Prefer recipient relay lists" description="Prefer recipient relay lists when delivering private posts." defaultOn />
    </>
  );
}

/* ───── Advanced ───── */

function AdvancedContent() {
  const clearLocalData = async () => {
    useSettingsStore.getState().reset();
    try {
      await db.delete();
    } catch { /* ignore */ }
    try {
      localStorage.clear();
    } catch { /* ignore */ }
    window.location.reload();
  };

  return (
    <>
      <h2 className="text-[24px] font-semibold text-text-primary">Advanced</h2>
      <p className="text-[11px] text-text-tertiary mt-1 mb-6">Advanced configuration and developer options.</p>
      <ToggleRow settingKey="developer-mode" label="Developer mode" description="Show additional debugging and development tools." />
      <hr className="border-border" />
      <ToggleRow settingKey="debug-logging" label="Debug logging" description="Write detailed logs to the console." />
      <hr className="border-border" />
      <div className="flex items-center justify-between py-3">
        <div className="flex-1 pr-4">
          <p className="text-[14px] font-medium text-text-primary">Clear local data</p>
          <p className="text-[11px] text-text-tertiary mt-0.5">Remove all locally cached data and reset settings.</p>
        </div>
        <button onClick={clearLocalData} className="h-9 px-4 rounded-[10px] bg-danger/10 border border-danger/30 text-danger text-[11px] font-medium cursor-pointer hover:bg-danger/20 transition-all flex-shrink-0">
          Clear data
        </button>
      </div>
    </>
  );
}
