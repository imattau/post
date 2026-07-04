import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SenderBlock from "../SenderBlock";

describe("SenderBlock", () => {
  const baseProps = {
    name: "Alice Nguyen",
    npub: "npub1alice…x9k2",
    avatarInitials: "AL",
    recipientName: "Matt",
    verified: true,
    createdAt: Date.now(),
  };

  it("renders sender name", () => {
    render(<SenderBlock {...baseProps} />);
    expect(screen.getByText("Alice Nguyen")).toBeInTheDocument();
  });

  it("renders npub", () => {
    render(<SenderBlock {...baseProps} />);
    expect(screen.getByText(/npub1alice/)).toBeInTheDocument();
  });

  it("renders recipient name", () => {
    render(<SenderBlock {...baseProps} />);
    expect(screen.getByText(/to Matt/)).toBeInTheDocument();
  });

  it("shows verified badge when verified is true", () => {
    render(<SenderBlock {...baseProps} verified={true} />);
    expect(screen.getByText(/verified/)).toBeInTheDocument();
  });

  it("hides verified badge when verified is false", () => {
    render(<SenderBlock {...baseProps} verified={false} />);
    expect(screen.queryByText("✓ verified")).not.toBeInTheDocument();
  });

  it("renders formatted date", () => {
    const date = new Date("2025-01-15T14:30:00").getTime();
    render(<SenderBlock {...baseProps} createdAt={date} />);
    expect(screen.getByText(/Jan 15/)).toBeInTheDocument();
  });
});
