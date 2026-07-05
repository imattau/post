import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { generateId } from "@/lib/utils";
import { db } from "@/lib/db/schema";
import type { Label } from "@/lib/types";

interface LabelsState {
  byId: Record<string, Label>;
  allIds: string[];
  createLabel: (name: string, color: string) => Promise<string>;
  deleteLabel: (id: string) => Promise<void>;
  assignLabel: (messageId: string, labelId: string) => Promise<void>;
  removeLabel: (messageId: string, labelId: string) => Promise<void>;
}

export const useLabelsStore = create<LabelsState>()(immer((set, get) => ({
  byId: {},
  allIds: [],

  async createLabel(name: string, color: string): Promise<string> {
    const id = generateId();
    const label: Label = { id, name, color, messageIds: [] };
    await db.labels.put(label);
    set((state) => { state.byId[id] = label; state.allIds.push(id); });
    return id;
  },

  async deleteLabel(id: string) {
    const { byId, allIds } = get();
    const { [id]: _, ...rest } = byId;
    await db.labels.delete(id);
    set({ byId: rest, allIds: allIds.filter((i) => i !== id) });
  },

  async assignLabel(messageId: string, labelId: string) {
    const label = get().byId[labelId];
    if (!label || label.messageIds.includes(messageId)) return;
    const updated = { ...label, messageIds: [...label.messageIds, messageId] };
    await db.labels.put(updated);
    set((state) => { state.byId[labelId] = updated; });
  },

  async removeLabel(messageId: string, labelId: string) {
    const { byId } = get();
    const label = byId[labelId];
    if (!label) return;
    const updated = { ...label, messageIds: label.messageIds.filter((id) => id !== messageId) };
    await db.labels.put(updated);
    set({ byId: { ...byId, [labelId]: updated } });
  },
})));
