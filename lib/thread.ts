import type { Message } from "@post/nostr-core";

export function getThreadMessages(
  messageId: string,
  byId: Record<string, Message>
): Message[] {
  const current = byId[messageId];
  if (!current) return [];

  if (current.conversationId) {
    return Object.values(byId)
      .filter((m) => m.conversationId === current.conversationId && m.id !== messageId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  const thread: Message[] = [];
  let walk = byId[messageId];
  while (walk?.replyTo) {
    const parent = byId[walk.replyTo];
    if (!parent) break;
    if (thread.some((m) => m.id === parent.id)) break;
    thread.unshift(parent);
    walk = parent;
  }
  return thread;
}
