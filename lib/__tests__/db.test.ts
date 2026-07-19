import { describe, it, expect } from "vitest";
import { db } from "@/lib/db/poly";

describe("PolyDB schema", () => {
  it("has messages table", () => {
    expect(db.messages).toBeDefined();
  });

  it("has drafts table", () => {
    expect(db.drafts).toBeDefined();
  });

  it("has labels table", () => {
    expect(db.labels).toBeDefined();
  });

  it("has contacts table", () => {
    expect(db.contacts).toBeDefined();
  });

  it("has relayConfigs table", () => {
    expect(db.relayConfigs).toBeDefined();
  });
});
