import { describe, it, expect } from "vitest";
import { PostDB } from "@/lib/db/schema";

describe("PostDB schema", () => {
  it("creates a database with name PostDB", () => {
    const db = new PostDB();
    expect(db.name).toBe("PostDB");
  });

  it("has messages table", () => {
    const db = new PostDB();
    expect(db.messages).toBeDefined();
  });

  it("has drafts table", () => {
    const db = new PostDB();
    expect(db.drafts).toBeDefined();
  });

  it("has labels table", () => {
    const db = new PostDB();
    expect(db.labels).toBeDefined();
  });

  it("has contacts table", () => {
    const db = new PostDB();
    expect(db.contacts).toBeDefined();
  });

  it("has relayConfigs table", () => {
    const db = new PostDB();
    expect(db.relayConfigs).toBeDefined();
  });

  it("version 3 has correct schema", () => {
    const db = new PostDB();
    expect(db.verno).toBe(3);
  });
});
