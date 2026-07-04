import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MessageRow from "../MessageRow";
import type { MockMessage } from "@/lib/mock/threads";

const unreadMessage: MockMessage = {
  id: "msg-1",
  sender: { id: "alice", name: "Alice Nguyen", npub: "npub1alice…x9k2", avatarInitials: "AL", verified: true },
  recipientName: "Matt",
  subject: "Hey! Great news",
  preview: "The team was really impressed...",
  body: "Full message body",
  createdAt: Date.now() - 15 * 60_000,
  read: false,
  starred: true,
  labels: ["Work"],
  attachments: [],
  encrypted: true,
  relayCount: 3,
  threadLength: 4,
};

const readMessage = { ...unreadMessage, id: "msg-2", read: true, starred: false, labels: [] };

describe("MessageRow", () => {
  it("renders sender name", () => {
    render(<MessageRow message={unreadMessage} selected={false} onClick={vi.fn()} />);
    expect(screen.getByText("Alice Nguyen")).toBeInTheDocument();
  });

  it("renders subject", () => {
    render(<MessageRow message={unreadMessage} selected={false} onClick={vi.fn()} />);
    expect(screen.getByText("Hey! Great news")).toBeInTheDocument();
  });

  it("renders preview", () => {
    render(<MessageRow message={unreadMessage} selected={false} onClick={vi.fn()} />);
    expect(screen.getByText("The team was really impressed...")).toBeInTheDocument();
  });

  it("shows unread dot when message is unread", () => {
    const { container } = render(<MessageRow message={unreadMessage} selected={false} onClick={vi.fn()} />);
    const dot = container.querySelector(".rounded-full");
    expect(dot).toBeInTheDocument();
  });

  it("renders label pills", () => {
    render(<MessageRow message={unreadMessage} selected={false} onClick={vi.fn()} />);
    expect(screen.getByText("Work")).toBeInTheDocument();
  });

  it("does not render labels when none exist", () => {
    render(<MessageRow message={readMessage} selected={false} onClick={vi.fn()} />);
    expect(screen.queryByText("Work")).not.toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<MessageRow message={unreadMessage} selected={false} onClick={onClick} />);
    await userEvent.click(screen.getByText("Alice Nguyen"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders time ago format", () => {
    render(<MessageRow message={unreadMessage} selected={false} onClick={vi.fn()} />);
    expect(screen.getByText("15 minutes")).toBeInTheDocument();
  });
});
