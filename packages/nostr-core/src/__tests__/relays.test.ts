import { describe, it, expect, vi, beforeEach } from "vitest";
import { DEFAULT_RELAYS, createRelayPool } from "../relays";

const { MockSimplePool, mockEnsureRelay, mockDestroy, mockSubscribeMany, mockPublish } = vi.hoisted(() => {
  const ensureRelay = vi.fn();
  const destroy = vi.fn();
  const subscribeMany = vi.fn(() => ({ close: vi.fn() }));
  const publish = vi.fn(() => [Promise.resolve()]);

  return {
    MockSimplePool: class {
      ensureRelay = ensureRelay;
      subscribeMany = subscribeMany;
      publish = publish;
      destroy = destroy;
    },
    mockEnsureRelay: ensureRelay,
    mockDestroy: destroy,
    mockSubscribeMany: subscribeMany,
    mockPublish: publish,
  };
});

vi.mock("nostr-tools/pool", () => ({ SimplePool: MockSimplePool }));

describe("DEFAULT_RELAYS", () => {
  it("contains 5 relay configs", () => {
    expect(DEFAULT_RELAYS).toHaveLength(5);
  });

  it("each config has url, read, write", () => {
    for (const relay of DEFAULT_RELAYS) {
      expect(relay).toHaveProperty("url");
      expect(relay).toHaveProperty("read");
      expect(relay).toHaveProperty("write");
    }
  });

  it("relay.damus.io is first", () => {
    expect(DEFAULT_RELAYS[0].url).toBe("wss://relay.damus.io");
  });
});

describe("createRelayPool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an object with all methods", () => {
    const pool = createRelayPool(DEFAULT_RELAYS);
    expect(pool).toHaveProperty("connectAll");
    expect(pool).toHaveProperty("disconnectAll");
    expect(pool).toHaveProperty("getStatus");
    expect(pool).toHaveProperty("subscribe");
    expect(pool).toHaveProperty("publish");
    expect(pool).toHaveProperty("getHealthPercent");
    expect(pool).toHaveProperty("getSyncedAgo");
  });

  it("connectAll calls ensureRelay for each relay", async () => {
    mockEnsureRelay.mockResolvedValue(undefined);
    const pool = createRelayPool(DEFAULT_RELAYS);
    await pool.connectAll();
    expect(mockEnsureRelay).toHaveBeenCalledTimes(5);
  });

  it("getStatus returns status for all relays after connect", async () => {
    mockEnsureRelay.mockResolvedValue(undefined);
    const pool = createRelayPool(DEFAULT_RELAYS);
    await pool.connectAll();
    const statuses = pool.getStatus();
    expect(statuses).toHaveLength(5);
    for (const s of statuses) {
      expect(s).toHaveProperty("url");
      expect(s).toHaveProperty("connected");
      expect(s).toHaveProperty("latency");
      expect(s).toHaveProperty("error");
    }
  });

  it("getHealthPercent returns 100 when all connected", async () => {
    mockEnsureRelay.mockResolvedValue(undefined);
    const pool = createRelayPool(DEFAULT_RELAYS);
    await pool.connectAll();
    expect(pool.getHealthPercent()).toBe(100);
  });

  it("getHealthPercent returns 0 when no relays", () => {
    const pool = createRelayPool([]);
    expect(pool.getHealthPercent()).toBe(0);
  });

  it("subscribe returns unsubscribe function", () => {
    const pool = createRelayPool(DEFAULT_RELAYS);
    const unsub = pool.subscribe([{ kinds: [1] }], vi.fn());
    expect(typeof unsub).toBe("function");
    expect(mockSubscribeMany).toHaveBeenCalled();
  });

  it("publish returns Map with results", async () => {
    const pool = createRelayPool(DEFAULT_RELAYS);
    const event = { id: "test", kind: 1, pubkey: "x", content: "", tags: [], created_at: 0, sig: "y" };
    const result = await pool.publish(event);
    expect(result).toBeInstanceOf(Map);
    expect(mockPublish).toHaveBeenCalled();
  });

  it("disconnectAll calls destroy", () => {
    const pool = createRelayPool(DEFAULT_RELAYS);
    pool.disconnectAll();
    expect(mockDestroy).toHaveBeenCalled();
  });

  it("partial connection failure still tracks connected relays", async () => {
    mockEnsureRelay
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Failed"))
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Failed"))
      .mockResolvedValueOnce(undefined);

    const pool = createRelayPool(DEFAULT_RELAYS);
    await pool.connectAll();
    expect(pool.getHealthPercent()).toBe(60);
  });
});
