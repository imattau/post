import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReplyComposer from "../ReplyComposer";

describe("ReplyComposer", () => {
  it("renders recipient name", () => {
    render(<ReplyComposer recipientName="Alice" />);
    expect(screen.getAllByText(/Alice/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders placeholder text", () => {
    render(<ReplyComposer recipientName="Alice" />);
    expect(screen.getByText("Reply to Alice…")).toBeInTheDocument();
  });

  it("renders format toolbar buttons", () => {
    render(<ReplyComposer recipientName="Alice" />);
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("I")).toBeInTheDocument();
    expect(screen.getByText("⌁")).toBeInTheDocument();
    expect(screen.getByText("☺")).toBeInTheDocument();
  });

  it("renders send button", () => {
    render(<ReplyComposer recipientName="Alice" />);
    expect(screen.getByText("Send")).toBeInTheDocument();
  });
});
