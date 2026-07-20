import type { Message } from "@post/nostr-core";
import { graph, EDGE } from "@/lib/db/poly";

export function getThreadMessages(
  messageId: string,
  byId: Record<string, Message>
): Message[] {
  const current = byId[messageId];
  if (!current) return [];

  const convIds = graph.getEdgeTargets(messageId, EDGE.PART_OF);
  if (convIds.length > 0) {
    const convId = convIds[0];
    const thread: Message[] = [];
    for (const id of Object.keys(byId)) {
      if (id === messageId) continue;
      if (graph.getEdgeTargets(id, EDGE.PART_OF).includes(convId)) {
        thread.push(byId[id]);
      }
    }
    return thread.sort((a, b) => a.createdAt - b.createdAt);
  }

  return graph.walkAncestors(messageId, EDGE.REPLIES_TO) as unknown as Message[];
}
