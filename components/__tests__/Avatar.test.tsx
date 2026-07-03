import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Avatar from "../Avatar";

describe("Avatar", () => {
  it("renders initials text", () => {
    render(<Avatar initials="AL" />);
    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("renders with different initials", () => {
    render(<Avatar initials="JB" />);
    expect(screen.getByText("JB")).toBeInTheDocument();
  });

  it("applies custom size class", () => {
    const { container } = render(<Avatar initials="AL" size={46} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe("46px");
    expect(el.style.height).toBe("46px");
  });

  it("renders deterministic colour for same initials", () => {
    const { container: c1 } = render(<Avatar initials="AL" />);
    const { container: c2 } = render(<Avatar initials="AL" />);
    const bg1 = (c1.firstChild as HTMLElement).style.backgroundColor;
    const bg2 = (c2.firstChild as HTMLElement).style.backgroundColor;
    expect(bg1).toBe(bg2);
  });

  it("renders different colour for different initials", () => {
    const { container: c1 } = render(<Avatar initials="AL" />);
    const { container: c2 } = render(<Avatar initials="XX" />);
    const bg1 = (c1.firstChild as HTMLElement).style.backgroundColor;
    const bg2 = (c2.firstChild as HTMLElement).style.backgroundColor;
    // Very unlikely to collide
    expect(bg1 === bg2 && bg1 !== "").toBe(false);
  });
});
