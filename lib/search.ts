import { graph } from "@/lib/db/poly";

export async function searchMessages(query: string, topK = 50): Promise<any[]> {
  if (!query.trim()) return [];
  const results = await graph.queryPersistedText(query, 0.1, topK);
  return results.whereNodeType("message").toArray();
}

export async function searchContacts(query: string, topK = 20): Promise<any[]> {
  if (!query.trim()) return [];
  const results = await graph.queryPersistedText(query, 0.1, topK);
  return results.whereNodeType("contact").toArray();
}

export async function searchDriveFiles(query: string, topK = 50): Promise<any[]> {
  if (!query.trim()) return [];
  const results = await graph.queryPersistedText(query, 0.1, topK);
  return results.whereNodeType("drive_file").toArray();
}

export async function searchAll<T>(query: string, type: string, topK = 50): Promise<T[]> {
  if (!query.trim()) return [];
  const results = await graph.queryPersistedText(query, 0.1, topK);
  return results.whereNodeType(type).toArray() as Promise<T[]>;
}
