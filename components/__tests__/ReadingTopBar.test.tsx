import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import ReadingTopBar from "../ReadingTopBar";

function renderTopBar(overrides: Partial<ComponentProps<typeof ReadingTopBar>> = {}) {
  const props = {
    onBack: vi.fn(),
    starred: false,
    read: true,
    spam: false,
    archived: false,
    onToggleStar: vi.fn(),
    onArchive: vi.fn(),
    onSnooze: vi.fn(),
    onDelete: vi.fn(),
    onToggleRead: vi.fn(),
    onToggleSpam: vi.fn(),
    onCopyEventId: vi.fn(),
    onReplyAll: vi.fn(),
    onForward: vi.fn(),
    messageId: "test-msg-1",
    ...overrides,
  };
  render(<ReadingTopBar {...props} />);
  return props;
}

describe("ReadingTopBar", () => {
  it("renders back button", () => {
    renderTopBar();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("renders action pills", () => {
    renderTopBar();
    expect(screen.getByText("Archive")).toBeInTheDocument();
    expect(screen.getByText("Snooze")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("back button click calls onBack", async () => {
    const onBack = vi.fn();
    renderTopBar({ onBack });
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("star button calls onToggleStar", async () => {
    const onToggleStar = vi.fn();
    renderTopBar({ onToggleStar });
    await userEvent.click(screen.getByRole("button", { name: "Star" }));
    expect(onToggleStar).toHaveBeenCalledOnce();
  });

  it("action buttons call their handlers", async () => {
    const onArchive = vi.fn();
    const onSnooze = vi.fn();
    const onDelete = vi.fn();
    renderTopBar({ onArchive, onSnooze, onDelete });

    await userEvent.click(screen.getByText("Archive"));
    await userEvent.click(screen.getByText("Snooze"));
    await userEvent.click(screen.getByText("Delete"));

    expect(onArchive).toHaveBeenCalledOnce();
    expect(onSnooze).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("renders more button", () => {
    renderTopBar();
    expect(screen.getByRole("button", { name: "More message actions" })).toBeInTheDocument();
  });

  it("dedicated read/unread button calls onToggleRead", async () => {
    const onToggleRead = vi.fn();
    renderTopBar({ onToggleRead, read: true });
    await userEvent.click(screen.getByText("Mark unread"));
    expect(onToggleRead).toHaveBeenCalledOnce();
  });

  it("more menu calls reply all and forward handlers", async () => {
    const onReplyAll = vi.fn();
    const onForward = vi.fn();
    renderTopBar({ onReplyAll, onForward });

    await userEvent.click(screen.getByRole("button", { name: "More message actions" }));
    await userEvent.click(await screen.findByText("Reply all"));
    await userEvent.click(screen.getByRole("button", { name: "More message actions" }));
    await userEvent.click(await screen.findByText("Forward"));

    expect(onReplyAll).toHaveBeenCalledOnce();
    expect(onForward).toHaveBeenCalledOnce();
  });

  it("more menu calls spam and copy handlers", async () => {
    const onToggleSpam = vi.fn();
    const onCopyEventId = vi.fn();
    renderTopBar({ onToggleSpam, onCopyEventId });

    await userEvent.click(screen.getByRole("button", { name: "More message actions" }));
    await userEvent.click(await screen.findByText("Mark spam"));
    await userEvent.click(screen.getByRole("button", { name: "More message actions" }));
    await userEvent.click(await screen.findByText("Copy event id"));

    expect(onToggleSpam).toHaveBeenCalledOnce();
    expect(onCopyEventId).toHaveBeenCalledOnce();
  });

  it("shows Move to inbox when archived", () => {
    renderTopBar({ archived: true });
    expect(screen.getByText("Move to inbox")).toBeInTheDocument();
  });

  it("shows Not spam when spam", () => {
    renderTopBar({ spam: true });
    expect(screen.getByText("Not spam")).toBeInTheDocument();
  });
});
