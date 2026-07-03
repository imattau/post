import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EmptyState from "../EmptyState";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No messages" />);
    expect(screen.getByText("No messages")).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    render(<EmptyState icon="▣" title="Empty" />);
    expect(screen.getByText("▣")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="Empty" description="Nothing to see here" />);
    expect(screen.getByText("Nothing to see here")).toBeInTheDocument();
  });

  it("renders action when provided", () => {
    render(<EmptyState title="Empty" action={<button>Action</button>} />);
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("renders without icon when not provided", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByText("▣")).not.toBeInTheDocument();
  });
});
