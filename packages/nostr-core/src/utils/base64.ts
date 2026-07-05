import { uint8ArrayToBase64, base64ToUint8Array } from "uint8array-extras";

export function toBase64(bytes: Uint8Array | ArrayBuffer): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return uint8ArrayToBase64(view);
}

export function fromBase64(value: string): Uint8Array {
  return base64ToUint8Array(value);
}

export function asArrayBuffer(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}
