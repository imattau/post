import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { generateId } from "@/lib/utils";
import { graph, putNode, deleteNode, addEdge, removeEdges, EDGE } from "@/lib/db/poly";
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
    const label: Label = { id, name, color };
    await putNode('label', id, label as any);
    set((state) => { state.byId[id] = label; state.allIds.push(id); });
    return id;
  },

  async deleteLabel(id: string) {
    const { byId, allIds } = get();
    const { [id]: _, ...rest } = byId;
    await deleteNode(id);
    set({ byId: rest, allIds: allIds.filter((i) => i !== id) });
  },

  async assignLabel(messageId: string, labelId: string) {
    const label = get().byId[labelId];
    if (!label) return;
    await putNode('label', labelId, label as any);
    await addEdge(messageId, EDGE.HAS_LABEL, labelId);
  },

  async removeLabel(messageId: string, labelId: string) {
    const { byId } = get();
    const label = byId[labelId];
    if (!label) return;
    await putNode('label', labelId, label as any);
    await removeEdges(messageId, EDGE.HAS_LABEL, labelId);
  },
})));
