import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReadingTopBar from "../ReadingTopBar";

describe("ReadingTopBar", () => {
  it("renders back button", () => {
    render(<ReadingTopBar onBack={vi.fn()} starred={false} onToggleStar={vi.fn()} />);
    expect(screen.getByText("←")).toBeInTheDocument();
  });

  it("renders action pills", () => {
    render(<ReadingTopBar onBack={vi.fn()} starred={false} onToggleStar={vi.fn()} />);
    expect(screen.getByText("Archive")).toBeInTheDocument();
    expect(screen.getByText("Snooze")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("back button click calls onBack", async () => {
    const onBack = vi.fn();
    render(<ReadingTopBar onBack={onBack} starred={false} onToggleStar={vi.fn()} />);
    await userEvent.click(screen.getByText("←"));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("star button calls onToggleStar", async () => {
    const onToggleStar = vi.fn();
    render(<ReadingTopBar onBack={vi.fn()} starred={false} onToggleStar={onToggleStar} />);
    await userEvent.click(screen.getByText("☆"));
    expect(onToggleStar).toHaveBeenCalledOnce();
  });

  it("renders more button", () => {
    render(<ReadingTopBar onBack={vi.fn()} starred={false} onToggleStar={vi.fn()} />);
    expect(screen.getByText("⋮")).toBeInTheDocument();
  });
});
