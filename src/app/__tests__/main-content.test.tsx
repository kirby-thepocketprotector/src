import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MainContent } from "../main-content";
import { describe, it, expect, vi } from "vitest";

// Mock the child components
vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div>Chat Interface</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div>File Tree</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div>Code Editor</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div>Preview Frame</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div>Header Actions</div>,
}));

describe("MainContent", () => {
  it("should toggle between Preview and Code views when clicking toggle buttons", async () => {
    render(<MainContent />);

    // Initially, Preview should be active and visible
    expect(screen.getByText("Preview Frame")).toBeInTheDocument();
    expect(screen.queryByText("File Tree")).not.toBeInTheDocument();
    expect(screen.queryByText("Code Editor")).not.toBeInTheDocument();

    // Find and click the Code button
    const codeButton = screen.getByRole("tab", { name: /code/i });
    fireEvent.click(codeButton);

    // Wait for the Code view to appear
    await waitFor(() => {
      expect(screen.getByText("File Tree")).toBeInTheDocument();
      expect(screen.getByText("Code Editor")).toBeInTheDocument();
      expect(screen.queryByText("Preview Frame")).not.toBeInTheDocument();
    });

    // Click the Preview button again
    const previewButton = screen.getByRole("tab", { name: /preview/i });
    fireEvent.click(previewButton);

    // Wait for the Preview view to appear
    await waitFor(() => {
      expect(screen.getByText("Preview Frame")).toBeInTheDocument();
      expect(screen.queryByText("File Tree")).not.toBeInTheDocument();
      expect(screen.queryByText("Code Editor")).not.toBeInTheDocument();
    });
  });

  it("should have proper ARIA attributes on toggle buttons", () => {
    render(<MainContent />);

    const previewButton = screen.getByRole("tab", { name: /preview/i });
    const codeButton = screen.getByRole("tab", { name: /code/i });

    // Preview should be selected initially
    expect(previewButton).toHaveAttribute("data-state", "active");
    expect(codeButton).toHaveAttribute("data-state", "inactive");
  });
});
