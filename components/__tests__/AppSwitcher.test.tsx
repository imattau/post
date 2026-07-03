import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppSwitcher from "../AppSwitcher";

describe("AppSwitcher", () => {
  it("renders 6 app tiles in a grid", () => {
    render(<AppSwitcher onClose={vi.fn()} />);
    expect(screen.getByText("M")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("N")).toBeInTheDocument();
    expect(screen.getByText("P")).toBeInTheDocument();
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("renders app names under tiles", () => {
    render(<AppSwitcher onClose={vi.fn()} />);
    expect(screen.getByText("Post")).toBeInTheDocument();
    expect(screen.getByText("Drive")).toBeInTheDocument();
    expect(screen.getByText("Contacts")).toBeInTheDocument();
  });

  it("Post tile links to /mail/inbox", () => {
    render(<AppSwitcher onClose={vi.fn()} />);
    const postLink = screen.getByText("Post").closest("a");
    expect(postLink).toHaveAttribute("href", "/mail/inbox");
  });

  it("Contacts tile links to /contacts", () => {
    render(<AppSwitcher onClose={vi.fn()} />);
    const contactsLink = screen.getByText("Contacts").closest("a");
    expect(contactsLink).toHaveAttribute("href", "/contacts");
  });

  it("renders footer text", () => {
    render(<AppSwitcher onClose={vi.fn()} />);
    expect(screen.getByText(/Shared identity/)).toBeInTheDocument();
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = vi.fn();
    render(<AppSwitcher onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders Nostr Suite heading", () => {
    render(<AppSwitcher onClose={vi.fn()} />);
    expect(screen.getByText("Nostr Suite")).toBeInTheDocument();
  });

  it("renders All apps link", () => {
    render(<AppSwitcher onClose={vi.fn()} />);
    expect(screen.getByText("All apps")).toBeInTheDocument();
  });
});
