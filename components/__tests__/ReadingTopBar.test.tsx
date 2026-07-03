import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import ReadingTopBar from "../ReadingTopBar";

function renderTopBar(overrides: Partial<ComponentProps<typeof ReadingTopBar>> = {}) {
  const props = {
    onBack: vi.fn(),
    starred: false,
    onToggleStar: vi.fn(),
    onArchive: vi.fn(),
    onSnooze: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
  render(<ReadingTopBar {...props} />);
  return props;
}

describe("ReadingTopBar", () => {
  it("renders back button", () => {
    renderTopBar();
    expect(screen.getByText("←")).toBeInTheDocument();
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
    await userEvent.click(screen.getByText("←"));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("star button calls onToggleStar", async () => {
    const onToggleStar = vi.fn();
    renderTopBar({ onToggleStar });
    await userEvent.click(screen.getByText("☆"));
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
    expect(screen.getByText("⋮")).toBeInTheDocument();
  });
});
