import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SubjectPills from "../SubjectPills";

describe("SubjectPills", () => {
  it("renders label pills", () => {
    render(<SubjectPills labels={["Work", "Friends"]} encrypted={false} relayCount={3} />);
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Friends")).toBeInTheDocument();
  });

  it("renders encrypted pill when encrypted is true", () => {
    render(<SubjectPills labels={[]} encrypted={true} relayCount={3} />);
    expect(screen.getByText("Encrypted")).toBeInTheDocument();
  });

  it("does not render encrypted pill when encrypted is false", () => {
    render(<SubjectPills labels={[]} encrypted={false} relayCount={3} />);
    expect(screen.queryByText("Encrypted")).not.toBeInTheDocument();
  });

  it("renders relay count pill", () => {
    render(<SubjectPills labels={[]} encrypted={false} relayCount={5} />);
    expect(screen.getByText("5 relays")).toBeInTheDocument();
  });

  it("renders only relay pill when no labels and not encrypted", () => {
    render(<SubjectPills labels={[]} encrypted={false} relayCount={3} />);
    expect(screen.getByText("3 relays")).toBeInTheDocument();
    expect(screen.queryByText("Encrypted")).not.toBeInTheDocument();
  });
});
