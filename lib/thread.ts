import type { Message } from "@post/nostr-core";

export function getThreadMessages(
  messageId: string,
  byId: Record<string, Message>
): Message[] {
  const thread: Message[] = [];
  let current = byId[messageId];
  while (current?.replyTo) {
    const parent = byId[current.replyTo];
    if (!parent) break;
    if (thread.some((m) => m.id === parent.id)) break;
    thread.unshift(parent);
    current = parent;
  }
  return thread;
}
