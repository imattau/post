import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AttachmentCard from "../AttachmentCard";

describe("AttachmentCard", () => {
  const baseProps = {
    fileName: "test.pdf",
    sizeBytes: 2_400_000,
    encrypted: true,
    sha256: "abc123",
    mimeType: "application/pdf",
  };

  it("renders filename", () => {
    render(<AttachmentCard {...baseProps} />);
    expect(screen.getByText("test.pdf")).toBeInTheDocument();
  });

  it("renders formatted size", () => {
    render(<AttachmentCard {...baseProps} />);
    expect(screen.getByText(/2\.4 MB/)).toBeInTheDocument();
  });

  it("renders encrypted label", () => {
    render(<AttachmentCard {...baseProps} encrypted={true} />);
    expect(screen.getByText(/encrypted/)).toBeInTheDocument();
  });

  it("does not render encrypted when not encrypted", () => {
    render(<AttachmentCard {...baseProps} encrypted={false} />);
    expect(screen.queryByText(/encrypted/)).not.toBeInTheDocument();
  });

  it("renders Save to Drive button when not stored", () => {
    render(<AttachmentCard {...baseProps} storedInDrive={false} />);
    expect(screen.getByText("Save to Drive")).toBeInTheDocument();
  });

  it("renders Drive link with sha256 when stored", () => {
    render(<AttachmentCard {...baseProps} sha256="sha-test" storedInDrive={true} />);
    const link = screen.getByText("Open in Drive");
    expect(link.closest("a")).toHaveAttribute("href", expect.stringContaining("/drive?blob=sha-test"));
  });

  it("shows Preview button for images", () => {
    render(<AttachmentCard {...baseProps} mimeType="image/jpeg" />);
    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  it("hides Preview button for non-images", () => {
    render(<AttachmentCard {...baseProps} mimeType="application/pdf" />);
    expect(screen.queryByText("Preview")).not.toBeInTheDocument();
  });

  it("formats small files in KB", () => {
    render(<AttachmentCard {...baseProps} sizeBytes= {50_000} />);
    expect(screen.getByText(/50 KB/)).toBeInTheDocument();
  });
});
