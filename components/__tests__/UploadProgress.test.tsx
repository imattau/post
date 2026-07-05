import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UploadProgress from "../UploadProgress";

const mockFiles = [
  { id: "1", name: "Product-demo.mp4", sizeBytes: 284_000_000, progress: 72, status: "uploading" as const, letter: "P", color: "var(--color-warn)" },
  { id: "2", name: "Research-pack.pdf", sizeBytes: 18_400_000, progress: 100, status: "complete" as const, letter: "R", color: "var(--color-ok)" },
  { id: "3", name: "Notes-export.md", sizeBytes: 84_000, progress: 100, status: "complete" as const, letter: "N", color: "var(--color-ok)" },
];

describe("UploadProgress", () => {
  it("renders header with file count", () => {
    render(<UploadProgress files={mockFiles} totalComplete={2} totalCount={3} onHide={vi.fn()} />);
    expect(screen.getByText("Uploading 3 files")).toBeInTheDocument();
  });

  it("renders completion counter", () => {
    render(<UploadProgress files={mockFiles} totalComplete={2} totalCount={3} onHide={vi.fn()} />);
    expect(screen.getByText("2 of 3 complete")).toBeInTheDocument();
  });

  it("renders all file rows", () => {
    render(<UploadProgress files={mockFiles} totalComplete={2} totalCount={3} onHide={vi.fn()} />);
    expect(screen.getByText("Product-demo.mp4")).toBeInTheDocument();
    expect(screen.getByText("Research-pack.pdf")).toBeInTheDocument();
    expect(screen.getByText("Notes-export.md")).toBeInTheDocument();
  });

  it("renders formatted file sizes", () => {
    render(<UploadProgress files={mockFiles} totalComplete={2} totalCount={3} onHide={vi.fn()} />);
    expect(screen.getByText(/284/)).toBeInTheDocument();
    expect(screen.getByText(/18\.4/)).toBeInTheDocument();
    expect(screen.getByText(/84 kB/)).toBeInTheDocument();
  });

  it("shows percentage for uploading files", () => {
    render(<UploadProgress files={mockFiles} totalComplete={2} totalCount={3} onHide={vi.fn()} />);
    expect(screen.getByText("72%")).toBeInTheDocument();
  });

  it("shows Complete for done files", () => {
    render(<UploadProgress files={mockFiles} totalComplete={2} totalCount={3} onHide={vi.fn()} />);
    const completeLabels = screen.getAllByText("Complete");
    expect(completeLabels).toHaveLength(2);
  });

  it("renders footer text with provider count", () => {
    render(<UploadProgress files={mockFiles} totalComplete={2} totalCount={3} onHide={vi.fn()} />);
    expect(screen.getByText(/Encrypting before upload/)).toBeInTheDocument();
    expect(screen.getByText(/3 providers selected/)).toBeInTheDocument();
  });

  it("Hide button calls onHide", async () => {
    const onHide = vi.fn();
    render(<UploadProgress files={mockFiles} totalComplete={2} totalCount={3} onHide={onHide} />);
    await userEvent.click(screen.getByText("Hide"));
    expect(onHide).toHaveBeenCalledOnce();
  });

  it("singular file count renders correctly", () => {
    render(<UploadProgress files={[mockFiles[0]]} totalComplete={0} totalCount={1} onHide={vi.fn()} />);
    expect(screen.getByText("Uploading 1 file")).toBeInTheDocument();
    expect(screen.getByText("0 of 1 complete")).toBeInTheDocument();
  });
});
