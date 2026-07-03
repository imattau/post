import { create } from "zustand";
import type { Label } from "@/lib/types";

interface LabelsState {
  byId: Record<string, Label>;
  allIds: string[];
  createLabel: (name: string, color: string) => Promise<string>;
  deleteLabel: (id: string) => Promise<void>;
  assignLabel: (messageId: string, labelId: string) => Promise<void>;
  removeLabel: (messageId: string, labelId: string) => Promise<void>;
}

export const useLabelsStore = create<LabelsState>((set, get) => ({
  byId: {},
  allIds: [],

  async createLabel(name: string, color: string): Promise<string> {
    const id = crypto.randomUUID();
    const label: Label = { id, name, color, messageIds: [] };
    const { db } = await import("@/lib/db/schema");
    await db.labels.put(label);
    set((state) => ({
      byId: { ...state.byId, [id]: label },
      allIds: [...state.allIds, id],
    }));
    return id;
  },

  async deleteLabel(id: string) {
    const { byId, allIds } = get();
    const { [id]: _, ...rest } = byId;
    const { db } = await import("@/lib/db/schema");
    await db.labels.delete(id);
    set({ byId: rest, allIds: allIds.filter((i) => i !== id) });
  },

  async assignLabel(messageId: string, labelId: string) {
    const { byId } = get();
    const label = byId[labelId];
    if (!label || label.messageIds.includes(messageId)) return;
    const updated = { ...label, messageIds: [...label.messageIds, messageId] };
    const { db } = await import("@/lib/db/schema");
    await db.labels.put(updated);
    set({ byId: { ...byId, [labelId]: updated } });
  },

  async removeLabel(messageId: string, labelId: string) {
    const { byId } = get();
    const label = byId[labelId];
    if (!label) return;
    const updated = { ...label, messageIds: label.messageIds.filter((id) => id !== messageId) };
    const { db } = await import("@/lib/db/schema");
    await db.labels.put(updated);
    set({ byId: { ...byId, [labelId]: updated } });
  },
}));
