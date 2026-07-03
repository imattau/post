import type { AttachmentRef } from "./types";

export interface BlossomServer {
  url: string;
}

export async function uploadBlob(
  server: BlossomServer,
  file: File,
  pubkey: string,
  onProgress?: (percent: number) => void
): Promise<AttachmentRef> {
  const formData = new FormData();
  formData.append("file", file);

  const xhr = new XMLHttpRequest();
  xhr.open("PUT", `${server.url}/upload`);

  if (onProgress) {
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
  }

  return new Promise((resolve, reject) => {
    xhr.onload = () => {
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
    xhr.send(formData);
  });
}

export async function downloadBlob(ref: AttachmentRef): Promise<ArrayBuffer> {
  const response = await fetch(ref.url);
  if (!response.ok) throw new Error(`Download failed with status ${response.status}`);
  return response.arrayBuffer();
}

export async function deleteBlob(
  server: BlossomServer,
  sha256: string,
  pubkey: string
): Promise<void> {
  const response = await fetch(`${server.url}/${sha256}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Delete failed with status ${response.status}`);
}
