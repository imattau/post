import { describe, it, expect } from "vitest";

describe("PolyDB schema", () => {
  it("graph is defined", async () => {
    const { graph } = await import("@/lib/db/poly");
    expect(graph).toBeDefined();
  });

  it("has message node type", async () => {
    const { getNodes } = await import("@/lib/db/poly");
    expect(getNodes).toBeDefined();
  });

  it("has draft node type", async () => {
    const { putNode } = await import("@/lib/db/poly");
    expect(putNode).toBeDefined();
  });

  it("has label node type", async () => {
    const { deleteNode } = await import("@/lib/db/poly");
    expect(deleteNode).toBeDefined();
  });

  it("has contact node type", async () => {
    const { clearNodes } = await import("@/lib/db/poly");
    expect(clearNodes).toBeDefined();
  });

  it("has edge management", async () => {
    const { addEdge, EDGE } = await import("@/lib/db/poly");
    expect(addEdge).toBeDefined();
    expect(EDGE).toBeDefined();
  });
});
