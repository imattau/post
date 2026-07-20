import { graph } from "@/lib/db/poly";

export async function searchMessages(query: string, topK = 50): Promise<any[]> {
  return graph.searchNodes(query, "message", 0.1, topK);
}

export async function searchContacts(query: string, topK = 20): Promise<any[]> {
  return graph.searchNodes(query, "contact", 0.1, topK);
}

export async function searchDriveFiles(query: string, topK = 50): Promise<any[]> {
  return graph.searchNodes(query, "drive_file", 0.1, topK);
}

export async function searchAll<T>(query: string, type: string, topK = 50): Promise<T[]> {
  return graph.searchNodes<T>(query, type, 0.1, topK);
}
