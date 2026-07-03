import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import MessageBody from "../MessageBody";

describe("MessageBody", () => {
  it("renders plain text paragraphs", () => {
    const { container } = render(<MessageBody body="Hello world" />);
    expect(container.textContent).toContain("Hello world");
  });

  it("renders bold text with ** markers", () => {
    const { container } = render(<MessageBody body="This is **bold** text" />);
    expect(container.textContent).toContain("bold");
    expect(container.textContent).not.toContain("**");
  });

  it("renders bullet list items", () => {
    const { container } = render(<MessageBody body="• Item one\n• Item two" />);
    expect(container.textContent).toContain("Item one");
    expect(container.textContent).toContain("Item two");
  });

  it("renders numbered list items", () => {
    const { container } = render(<MessageBody body="1. First\n2. Second" />);
    expect(container.textContent).toContain("First");
    expect(container.textContent).toContain("Second");
  });

  it("renders empty lines as spacing", () => {
    const { container } = render(<MessageBody body="Line 1\n\nLine 2" />);
    expect(container.textContent).toContain("Line 1");
    expect(container.textContent).toContain("Line 2");
  });
});
