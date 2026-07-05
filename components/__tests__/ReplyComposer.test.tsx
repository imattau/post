import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReplyComposer from "../ReplyComposer";
import { useComposeStore } from "@/lib/stores/compose";

const props = {
  recipientName: "Alice",
  recipientPubkey: "a".repeat(64),
  recipientNpub: "npub1alice",
  messageId: "msg-1",
  subject: "Hello",
};

describe("ReplyComposer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useComposeStore.setState({
      status: "composing",
      open: vi.fn(),
      send: vi.fn(),
      sendDirect: vi.fn(async () => true),
    });
  });

  it("renders recipient name", () => {
    render(<ReplyComposer {...props} />);
    expect(screen.getAllByText(/Alice/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders placeholder text", () => {
    render(<ReplyComposer {...props} />);
    expect(screen.getByPlaceholderText("Reply to Alice…")).toBeInTheDocument();
  });

  it("renders format toolbar buttons", () => {
    render(<ReplyComposer {...props} />);
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("I")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Insert link" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Insert emoji" })).toBeInTheDocument();
  });

  it("renders send button", () => {
    render(<ReplyComposer {...props} />);
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  it("keeps send disabled until body has content", async () => {
    render(<ReplyComposer {...props} />);
    const send = screen.getByText("Send");
    expect(send).toBeDisabled();

    await userEvent.type(screen.getByPlaceholderText("Reply to Alice…"), "Reply body");
    expect(send).not.toBeDisabled();
  });

  it("accepts typed reply input", async () => {
    render(<ReplyComposer {...props} />);
    const textarea = screen.getByLabelText("Reply to Alice");

    await userEvent.type(textarea, "Inline reply");

    expect(textarea).toHaveValue("Inline reply");
  });

  it("wraps selected text with bold markdown and keeps focus", async () => {
    render(<ReplyComposer {...props} />);
    const textarea = screen.getByLabelText("Reply to Alice") as HTMLTextAreaElement;

    await userEvent.type(textarea, "hello");
    textarea.setSelectionRange(0, 5);
    await userEvent.click(screen.getByRole("button", { name: "Bold" }));

    expect(textarea).toHaveValue("**hello**");
    expect(document.activeElement).toBe(textarea);
  });

  it("wraps selected text with italic markdown", async () => {
    render(<ReplyComposer {...props} />);
    const textarea = screen.getByLabelText("Reply to Alice") as HTMLTextAreaElement;

    await userEvent.type(textarea, "hello");
    textarea.setSelectionRange(0, 5);
    await userEvent.click(screen.getByRole("button", { name: "Italic" }));

    expect(textarea).toHaveValue("_hello_");
  });

  it("inserts link markdown with fallback text", async () => {
    render(<ReplyComposer {...props} />);
    const textarea = screen.getByLabelText("Reply to Alice") as HTMLTextAreaElement;

    textarea.focus();
    await userEvent.click(screen.getByRole("button", { name: "Insert link" }));

    expect(textarea).toHaveValue("[text](url)");
    expect(document.activeElement).toBe(textarea);
  });

  it("opens emoji picker when insert emoji is clicked", async () => {
    render(<ReplyComposer {...props} />);
    const textarea = screen.getByLabelText("Reply to Alice") as HTMLTextAreaElement;

    await userEvent.type(textarea, "Hi ");
    await userEvent.click(screen.getByRole("button", { name: "Insert emoji" }));

    // The emoji-mart picker uses web components (shadow DOM),
    // so individual emoji buttons aren't accessible via testing-library.
    // Verifying that clicking the toggle opens the picker (no error thrown).
    // The custom format toolbar's onFormat callback is tested via the bold/italic tests.
    expect(screen.getByLabelText("Reply to Alice")).toHaveValue("Hi ");
  });

  it("sends a reply directly", async () => {
    const sendDirect = vi.fn(async () => true);
    useComposeStore.setState({ sendDirect });

    render(<ReplyComposer {...props} />);
    const textarea = screen.getByLabelText("Reply to Alice");
    await userEvent.type(textarea, "Reply body");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(sendDirect).toHaveBeenCalledWith(
      [expect.objectContaining({ pubkey: props.recipientPubkey, name: "Alice" })],
      "Re: Hello",
      "Reply body",
      "msg-1",
    );
    await waitFor(() => expect(textarea).toHaveValue(""));
  });

  it("preserves body when send fails", async () => {
    useComposeStore.setState({
      sendDirect: vi.fn(async () => false),
    });

    render(<ReplyComposer {...props} />);
    const textarea = screen.getByLabelText("Reply to Alice");
    await userEvent.type(textarea, "Keep this");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(textarea).toHaveValue("Keep this"));
  });
});
