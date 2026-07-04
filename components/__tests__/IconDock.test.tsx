import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import IconDock from "../IconDock";

vi.mock("@/lib/stores/identity", () => ({
  useIdentityStore: Object.assign(
    (selector: (s: any) => any) => selector({
      identity: { npub: "npub1test", pubkey: "a".repeat(64), nsec: null, nip05: null, nip05Verified: false, profile: null },
      nip07Available: false,
      usingNip07: false,
      createOrImport: vi.fn(),
      connectNip07: vi.fn(),
      logout: vi.fn(),
      getSigner: vi.fn(),
    }),
    { getState: () => ({ identity: null }) }
  ),
}));

describe("IconDock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders logo tile with N", () => {
    render(<IconDock />);
    const nElements = screen.getAllByText("N");
    expect(nElements.length).toBeGreaterThanOrEqual(1);
  });

  it("renders Post tile with M", () => {
    render(<IconDock />);
    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("renders inactive app tiles", () => {
    render(<IconDock />);
    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("P")).toBeInTheDocument();
  });

  it("renders search button", () => {
    render(<IconDock />);
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  });

  it("renders help button", () => {
    render(<IconDock />);
    expect(screen.getByRole("button", { name: "Help" })).toBeInTheDocument();
  });

  it("renders avatar with initial from npub", () => {
    render(<IconDock />);
    // npub1test → slice(5, 6) = "t" → toUpperCase() = "T"
    expect(screen.getAllByText("T").length).toBeGreaterThanOrEqual(1);
  });

  it("clicking M tile opens app switcher", async () => {
    render(<IconDock />);
    await userEvent.click(screen.getByText("M"));
    expect(screen.getByText("Nostr Suite")).toBeInTheDocument();
  });
});
