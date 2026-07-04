import { nip98 } from "nostr-tools";
import { finalizeEvent } from "nostr-tools/pure";
import type { AttachmentRef } from "./types";

export interface BlossomServer {
  url: string;
}

function getSigner(sk: Uint8Array) {
  return (t: { kind: number; tags: string[][]; content: string; created_at: number }) =>
    finalizeEvent(t, sk);
}

export async function uploadBlob(
  server: BlossomServer,
  file: File,
  sk: Uint8Array,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<AttachmentRef> {
  const authToken = await nip98.getToken(
    `${server.url}/upload`,
    "PUT",
    getSigner(sk),
    true
  );

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `${server.url}/upload`);
    xhr.setRequestHeader("Authorization", authToken);

    const onAbort = () => {
      xhr.abort();
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }

    xhr.onload = () => {
      signal?.removeEventListener("abort", onAbort);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            id: response.sha256,
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            sha256: response.sha256,
            url: response.url || `${server.url}/${response.sha256}`,
            storedInDrive: false,
            encrypted: true,
          });
        } catch {
          reject(new Error("Invalid response from Blossom server"));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}

export async function downloadBlob(
  ref: AttachmentRef,
  sk: Uint8Array,
  serverUrl: string
): Promise<ArrayBuffer> {
  const authToken = await nip98.getToken(
    `${serverUrl}/${ref.sha256}`,
    "GET",
    getSigner(sk),
    true
  );

  const response = await fetch(`${serverUrl}/${ref.sha256}`, {
    headers: { Authorization: authToken },
  });
  if (!response.ok) throw new Error(`Download failed with status ${response.status}`);
  return response.arrayBuffer();
}

export async function deleteBlob(
  server: BlossomServer,
  sha256: string,
  sk: Uint8Array
): Promise<void> {
  const authToken = await nip98.getToken(
    `${server.url}/${sha256}`,
    "DELETE",
    getSigner(sk),
    true
  );

  const response = await fetch(`${server.url}/${sha256}`, {
    method: "DELETE",
    headers: { Authorization: authToken },
  });
  if (!response.ok) throw new Error(`Delete failed with status ${response.status}`);
}
