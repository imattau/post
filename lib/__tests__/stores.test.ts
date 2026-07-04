import { describe, it, expect, vi, beforeEach } from "vitest";

const driveFolderRows: any[] = [];
const driveFileRows: any[] = [];

vi.mock("@/lib/db/schema", () => ({
  db: {
    messages: { orderBy: vi.fn(() => ({ reverse: vi.fn(() => ({ toArray: vi.fn(async () => []) })) })), put: vi.fn(), delete: vi.fn(), where: vi.fn(() => ({ count: vi.fn(async () => 0) })) },
    drafts: {
      put: vi.fn(),
      delete: vi.fn(),
      get: vi.fn(async () => null),
      orderBy: vi.fn(() => ({ reverse: vi.fn(() => ({ toArray: vi.fn(async () => []) })) })),
    },
    labels: { put: vi.fn(), delete: vi.fn() },
    contacts: { toArray: vi.fn(async () => []), bulkPut: vi.fn(), put: vi.fn() },
    relayConfigs: { toArray: vi.fn(async () => []), put: vi.fn(), delete: vi.fn() },
    driveFiles: {
      count: vi.fn(async () => driveFileRows.length),
      bulkPut: vi.fn(async (rows: any[]) => { driveFileRows.splice(0, driveFileRows.length, ...rows); }),
      toArray: vi.fn(async () => [...driveFileRows]),
      put: vi.fn(async (row: any) => {
        const index = driveFileRows.findIndex((item) => item.id === row.id);
        if (index >= 0) driveFileRows[index] = row;
        else driveFileRows.push(row);
      }),
    },
    driveFolders: {
      count: vi.fn(async () => driveFolderRows.length),
      bulkPut: vi.fn(async (rows: any[]) => { driveFolderRows.splice(0, driveFolderRows.length, ...rows); }),
      toArray: vi.fn(async () => [...driveFolderRows]),
      put: vi.fn(async (row: any) => {
        const index = driveFolderRows.findIndex((item) => item.id === row.id);
        if (index >= 0) driveFolderRows[index] = row;
        else driveFolderRows.push(row);
      }),
    },
  },
}));

vi.mock("@post/nostr-core", async (importOriginal: () => Promise<Record<string, unknown>>) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createKeyStore: vi.fn(() => ({
      load: vi.fn(() => null),
      save: vi.fn(),
      clear: vi.fn(),
    })),
    generateKey: vi.fn(() => ({
      nsec: "nsec1generated",
      npub: "npub1generated",
      pubkey: "a".repeat(64),
    })),
    importFromNsec: vi.fn(() => ({
      npub: "npub1imported",
      pubkey: "b".repeat(64),
    })),
    createRelayPool: vi.fn(() => ({
      connectAll: vi.fn(),
      disconnectAll: vi.fn(),
      getStatus: vi.fn(() => [{ url: "wss://relay.damus.io", connected: true, latency: 50, lastEventAt: Date.now(), error: null }]),
      getHealthPercent: vi.fn(() => 100),
      getSyncedAgo: vi.fn(() => 0),
      subscribe: vi.fn(() => vi.fn()),
      publish: vi.fn(async () => new Map()),
    })),
    uploadBlob: vi.fn(async () => ({ id: "sha256", fileName: "test.txt", mimeType: "text/plain", sizeBytes: 100, sha256: "abc", url: "https://example.com/abc", storedInDrive: false, encrypted: true })),
    encryptDriveBlob: vi.fn(async () => ({
      ciphertext: new Blob(["ciphertext"], { type: "application/octet-stream" }),
      metadata: { version: 1, algorithm: "AES-GCM", salt: "salt", wrapIv: "wrap", fileIv: "file", wrappedKey: "key" },
    })),
  };
});

describe("identity store", () => {
  it("createOrImport generates a new key when no nsec provided", async () => {
    const { useIdentityStore } = await import("@/lib/stores/identity");
    const identity = await useIdentityStore.getState().createOrImport();
    expect(identity).toHaveProperty("npub");
    expect(identity).toHaveProperty("pubkey");
    expect(identity.nsec).toBe("nsec1generated");
  });

  it("createOrImport imports from nsec when provided", async () => {
    const { useIdentityStore } = await import("@/lib/stores/identity");
    const identity = await useIdentityStore.getState().createOrImport("nsec1test");
    expect(identity.npub).toBe("npub1imported");
  });

  it("logout clears identity and keyStore", async () => {
    const { useIdentityStore } = await import("@/lib/stores/identity");
    await useIdentityStore.getState().createOrImport();
    useIdentityStore.getState().logout();
    expect(useIdentityStore.getState().identity).toBeNull();
    expect(useIdentityStore.getState().keyStore).toBeNull();
  });

  it("nip07Available is false when window.nostr is undefined", async () => {
    const { useIdentityStore } = await import("@/lib/stores/identity");
    expect(useIdentityStore.getState().nip07Available).toBe(false);
  });

  it("connectNip07 reads pubkey from window.nostr", async () => {
    const mockPubkey = "c".repeat(64);
    (window as any).nostr = { getPublicKey: vi.fn(async () => mockPubkey), signEvent: vi.fn() };
    const { useIdentityStore } = await import("@/lib/stores/identity");
    const identity = await useIdentityStore.getState().connectNip07();
    expect(identity.pubkey).toBe(mockPubkey);
    expect(useIdentityStore.getState().usingNip07).toBe(true);
    delete (window as any).nostr;
  });
});

describe("relays store", () => {
  it("connect creates pool and updates statuses", async () => {
    const { useRelaysStore } = await import("@/lib/stores/relays");
    await useRelaysStore.getState().connect();
    expect(useRelaysStore.getState().connected).toBe(true);
    expect(useRelaysStore.getState().pool).not.toBeNull();
  });

  it("disconnect clears pool and state", async () => {
    const { useRelaysStore } = await import("@/lib/stores/relays");
    await useRelaysStore.getState().connect();
    useRelaysStore.getState().disconnect();
    expect(useRelaysStore.getState().connected).toBe(false);
    expect(useRelaysStore.getState().pool).toBeNull();
  });

  it("addRelay adds to relay list", async () => {
    const { useRelaysStore } = await import("@/lib/stores/relays");
    const initial = useRelaysStore.getState().relays.length;
    useRelaysStore.getState().addRelay({ url: "wss://test.relay", read: true, write: true });
    expect(useRelaysStore.getState().relays).toHaveLength(initial + 1);
  });

  it("removeRelay removes from relay list", async () => {
    const { useRelaysStore } = await import("@/lib/stores/relays");
    useRelaysStore.getState().removeRelay("wss://relay.damus.io");
    const urls = useRelaysStore.getState().relays.map((r: { url: string }) => r.url);
    expect(urls).not.toContain("wss://relay.damus.io");
  });
});

describe("messages store", () => {
  it("selectMessage sets selectedId", async () => {
    const { useMessagesStore } = await import("@/lib/stores/messages");
    useMessagesStore.getState().selectMessage("msg-1");
    expect(useMessagesStore.getState().selectedId).toBe("msg-1");
  });

  it("selectMessage(null) clears selectedId", async () => {
    const { useMessagesStore } = await import("@/lib/stores/messages");
    useMessagesStore.getState().selectMessage(null);
    expect(useMessagesStore.getState().selectedId).toBeNull();
  });

  it("ingestFromRelay adds message to store", async () => {
    const { useMessagesStore } = await import("@/lib/stores/messages");
    const msg: any = { id: "new-msg", kind: 14, pubkey: "x", content: "hello", createdAt: Date.now(), mailbox: "inbox" };
    useMessagesStore.getState().ingestFromRelay(msg);
    expect(useMessagesStore.getState().byId["new-msg"]).toBeDefined();
    expect(useMessagesStore.getState().ids).toContain("new-msg");
  });

  it("ingestFromRelay deduplicates", async () => {
    const { useMessagesStore } = await import("@/lib/stores/messages");
    const msg: any = { id: "dup", kind: 14, pubkey: "x", content: "hello", createdAt: Date.now(), mailbox: "inbox" };
    useMessagesStore.getState().ingestFromRelay(msg);
    const ids1 = useMessagesStore.getState().ids.length;
    useMessagesStore.getState().ingestFromRelay(msg);
    const ids2 = useMessagesStore.getState().ids.length;
    expect(ids2).toBe(ids1);
  });
});

describe("mailboxes store", () => {
  it("setFilter updates filter", async () => {
    const { useMailboxStore } = await import("@/lib/stores/mailboxes");
    useMailboxStore.getState().setFilter("unread");
    expect(useMailboxStore.getState().filter).toBe("unread");
  });
});

describe("labels store", () => {
  it("createLabel returns id and persists to store", async () => {
    const { useLabelsStore } = await import("@/lib/stores/labels");
    const id = await useLabelsStore.getState().createLabel("Test", "#FF0000");
    expect(id).toBeTruthy();
    expect(useLabelsStore.getState().byId[id].name).toBe("Test");
  });

  it("assignLabel adds messageId to label", async () => {
    const { useLabelsStore } = await import("@/lib/stores/labels");
    const id = await useLabelsStore.getState().createLabel("Work", "#60A5FA");
    await useLabelsStore.getState().assignLabel("msg-1", id);
    expect(useLabelsStore.getState().byId[id].messageIds).toContain("msg-1");
  });
});

describe("compose store", () => {
  it("status starts as closed", async () => {
    const { useComposeStore } = await import("@/lib/stores/compose");
    expect(useComposeStore.getState().status).toBe("closed");
  });

  it("open transitions to composing", async () => {
    const { useComposeStore } = await import("@/lib/stores/compose");
    useComposeStore.getState().open();
    expect(useComposeStore.getState().status).toBe("composing");
  });

  it("minimize blocks when draft is empty", async () => {
    const { useComposeStore } = await import("@/lib/stores/compose");
    useComposeStore.getState().open();
    useComposeStore.getState().minimize();
    expect(useComposeStore.getState().status).toBe("composing");
  });

  it("minimize works when draft has content", async () => {
    const { useComposeStore } = await import("@/lib/stores/compose");
    useComposeStore.getState().open();
    useComposeStore.getState().updateSubject("Test");
    await useComposeStore.getState().minimize();
    expect(useComposeStore.getState().status).toBe("minimized");
  });

  it("restore returns to composing", async () => {
    const { useComposeStore } = await import("@/lib/stores/compose");
    useComposeStore.getState().open();
    useComposeStore.getState().updateSubject("Test");
    await useComposeStore.getState().minimize();
    useComposeStore.getState().restore();
    expect(useComposeStore.getState().status).toBe("composing");
  });

  it("updateSubject with content transitions failed→composing", async () => {
    const { useComposeStore } = await import("@/lib/stores/compose");
    useComposeStore.getState().open();
    // Manually set to failed to test transition
    useComposeStore.setState({ status: "failed", error: "test error" });
    useComposeStore.getState().updateSubject("Fix");
    expect(useComposeStore.getState().status).toBe("composing");
  });

  it("updateBody with content transitions failed→composing", async () => {
    const { useComposeStore } = await import("@/lib/stores/compose");
    useComposeStore.getState().open();
    useComposeStore.setState({ status: "failed", error: "test error" });
    useComposeStore.getState().updateBody("Fix body");
    expect(useComposeStore.getState().status).toBe("composing");
  });

  it("open accepts reply draft context", async () => {
    const { useComposeStore } = await import("@/lib/stores/compose");
    useComposeStore.getState().open({
      to: [{ pubkey: "a".repeat(64), npub: "npub1test", name: "Alice", avatarUrl: "", isGroup: false }],
      subject: "Re: Hello",
      body: "Reply",
      replyTo: "root-event",
    });
    expect(useComposeStore.getState().draft.replyTo).toBe("root-event");
    expect(useComposeStore.getState().draft.to[0].pubkey).toBe("a".repeat(64));
  });

  it("updateAttachment stores upload result for send", async () => {
    const { useComposeStore } = await import("@/lib/stores/compose");
    const file = new File(["hello"], "hello.txt", { type: "text/plain" });
    const result = {
      id: "sha256",
      fileName: "hello.txt",
      mimeType: "text/plain",
      sizeBytes: 5,
      sha256: "abc",
      url: "https://example.com/abc",
      storedInDrive: false,
      encrypted: true,
    };

    useComposeStore.getState().open();
    useComposeStore.getState().addAttachment(file);
    useComposeStore.getState().updateAttachment(file.name, { status: "uploaded", progress: 100, result });

    expect(useComposeStore.getState().uploads[0].status).toBe("uploaded");
    expect(useComposeStore.getState().uploads[0].result).toEqual(result);
  });

  it("scheduleSend sets scheduledFor", async () => {
    const { useComposeStore } = await import("@/lib/stores/compose");
    useComposeStore.getState().open();
    const future = Date.now() + 86400000;
    await useComposeStore.getState().scheduleSend(future);
    expect(useComposeStore.getState().status).toBe("scheduled");
    expect(useComposeStore.getState().draft.scheduledFor).toBe(future);
  });

  it("discard resets draft and closes", async () => {
    const { useComposeStore } = await import("@/lib/stores/compose");
    useComposeStore.getState().open();
    useComposeStore.getState().updateSubject("Test");
    useComposeStore.getState().discard();
    expect(useComposeStore.getState().status).toBe("closed");
    expect(useComposeStore.getState().draft.subject).toBe("");
  });
});

describe("blossom store", () => {
  it("setServerUrl persists to localStorage", async () => {
    const { useBlossomStore } = await import("@/lib/stores/blossom");
    useBlossomStore.getState().setServerUrl("https://blossom.example.com");
    expect(useBlossomStore.getState().serverUrl).toBe("https://blossom.example.com");
    expect(localStorage.setItem).toHaveBeenCalledWith("blossom-server-url", "https://blossom.example.com");
  });

  it("uploadFile throws when no server configured", async () => {
    const { useBlossomStore } = await import("@/lib/stores/blossom");
    useBlossomStore.getState().setServerUrl("");
    await expect(useBlossomStore.getState().uploadFile(new File([], "test.txt"), new Uint8Array(32))).rejects.toThrow("No Blossom server");
  });

  it("loadBlossomConfig restores from localStorage", async () => {
    const { loadBlossomConfig, useBlossomStore } = await import("@/lib/stores/blossom");
    (localStorage.getItem as any).mockReturnValueOnce("https://restored.example.com");
    loadBlossomConfig();
    expect(useBlossomStore.getState().serverUrl).toBe("https://restored.example.com");
  });
});

describe("drive store", () => {
  beforeEach(async () => {
    driveFolderRows.splice(0, driveFolderRows.length);
    driveFileRows.splice(0, driveFileRows.length);
    const { useDriveStore } = await import("@/lib/stores/drive");
    useDriveStore.setState({
      files: [],
      folders: [],
      selectedFileId: null,
      query: "",
      filter: "all",
      sort: "recent",
      viewMode: "list",
      uploadJobs: [],
      loading: false,
      error: null,
    });
  });

  it("loads seeded demo drive records", async () => {
    const { useDriveStore } = await import("@/lib/stores/drive");
    await useDriveStore.getState().load();
    expect(useDriveStore.getState().files.length).toBeGreaterThan(0);
    expect(useDriveStore.getState().folders.length).toBeGreaterThan(0);
  });

  it("filters files by query and category", async () => {
    const { useDriveStore, getVisibleDriveFiles } = await import("@/lib/stores/drive");
    await useDriveStore.getState().load();
    useDriveStore.getState().setQuery("planning");
    useDriveStore.getState().setFilter("documents");
    const visible = getVisibleDriveFiles(useDriveStore.getState());
    expect(visible.some((file) => file.name.includes("planning"))).toBe(true);
  });

  it("filters files by drive screen", async () => {
    const { useDriveStore, getVisibleDriveFiles } = await import("@/lib/stores/drive");
    await useDriveStore.getState().load();
    const state = useDriveStore.getState();

    const recentCutoff = Date.now() - 1000 * 60 * 60 * 24 * 7;
    expect(getVisibleDriveFiles(state, "recent").every((file) => file.updatedAt >= recentCutoff)).toBe(true);
    expect(getVisibleDriveFiles(state, "shared").every((file) => file.sharedWith.length >= 3)).toBe(true);
    expect(getVisibleDriveFiles(state, "offline").every((file) => file.offlineAvailable)).toBe(true);
    expect(getVisibleDriveFiles(state, "from-post").every((file) => file.source === "post" || file.source === "attachment")).toBe(true);
    expect(getVisibleDriveFiles(state, "trash").every((file) => file.trashed)).toBe(true);
  });

  it("rejects uploads without a private key", async () => {
    const { useDriveStore } = await import("@/lib/stores/drive");
    useDriveStore.setState({ error: null });
    await useDriveStore.getState().enqueueUploads([new File(["x"], "test.pdf", { type: "application/pdf" })]);
    expect(useDriveStore.getState().error).toMatch(/local private key/);
  });

  it("uploads and persists an encrypted drive file", async () => {
    const { useDriveStore } = await import("@/lib/stores/drive");
    const { useIdentityStore } = await import("@/lib/stores/identity");
    const { useBlossomStore } = await import("@/lib/stores/blossom");
    const { nsecEncode } = await import("nostr-tools/nip19");
    const secretKey = new Uint8Array(32).fill(7);
    useIdentityStore.setState({
      identity: {
        npub: "npub1drive-test",
        nsec: nsecEncode(secretKey),
        pubkey: "a".repeat(64),
        nip05: null,
        nip05Verified: false,
        profile: null,
      },
      keyStore: null,
      usingNip07: false,
    });
    useBlossomStore.getState().setServerUrl("https://blossom.example.com");
    await useDriveStore.getState().enqueueUploads([new File(["drive"], "notes.md", { type: "text/markdown" })]);
    expect(useDriveStore.getState().files.some((file) => file.name === "notes.md")).toBe(true);
    expect(useDriveStore.getState().uploadJobs.at(0)?.status).toBe("complete");
  });
});
