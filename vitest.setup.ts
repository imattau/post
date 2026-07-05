import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/mail/inbox",
  useParams: () => ({}),
}));

// Mock next/font/google
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter" }),
}));

// Mock localStorage
const storage = new Map<string, string>();
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
    removeItem: vi.fn((key: string) => storage.delete(key)),
    clear: vi.fn(() => storage.clear()),
  },
  writable: true,
});

// Mock Tauri modules
vi.mock("@/lib/tauri", () => ({
  isTauri: () => false,
  createTauriKeyStore: () => null,
}));

// Mock crypto.randomUUID
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, "crypto", {
    value: { randomUUID: () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16); }) },
    writable: true,
  });
}
