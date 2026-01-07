import { test, expect, describe, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge, formatToolMessage } from "../ToolCallBadge";
import type { ToolInvocation } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

describe("formatToolMessage", () => {
  describe("str_replace_editor tool", () => {
    test("formats create command in progress", () => {
      const message = formatToolMessage(
        "str_replace_editor",
        { command: "create", path: "/App.jsx" },
        "in-progress"
      );
      expect(message).toBe("Creating /App.jsx");
    });

    test("formats create command completed", () => {
      const message = formatToolMessage(
        "str_replace_editor",
        { command: "create", path: "/App.jsx" },
        "result",
        "File created: /App.jsx"
      );
      expect(message).toBe("Created /App.jsx");
    });

    test("formats create command with error", () => {
      const message = formatToolMessage(
        "str_replace_editor",
        { command: "create", path: "/App.jsx" },
        "result",
        "Error: File already exists: /App.jsx"
      );
      expect(message).toBe("Failed to create /App.jsx");
    });

    test("formats str_replace command in progress", () => {
      const message = formatToolMessage(
        "str_replace_editor",
        {
          command: "str_replace",
          path: "/Card.jsx",
          old_str: "old",
          new_str: "new",
        },
        "in-progress"
      );
      expect(message).toBe("Editing /Card.jsx");
    });

    test("formats str_replace command completed", () => {
      const message = formatToolMessage(
        "str_replace_editor",
        {
          command: "str_replace",
          path: "/Card.jsx",
          old_str: "old",
          new_str: "new",
        },
        "result",
        "Replaced 1 occurrence(s) of the string in /Card.jsx"
      );
      expect(message).toBe("Edited /Card.jsx");
    });

    test("formats insert command", () => {
      const message = formatToolMessage(
        "str_replace_editor",
        {
          command: "insert",
          path: "/Button.jsx",
          insert_line: 10,
          new_str: "new line",
        },
        "result",
        "Text inserted at line 10 in /Button.jsx"
      );
      expect(message).toBe("Edited /Button.jsx");
    });

    test("formats view command", () => {
      const message = formatToolMessage(
        "str_replace_editor",
        { command: "view", path: "/components/Header.jsx" },
        "result",
        "file contents"
      );
      expect(message).toBe("Viewed /components/Header.jsx");
    });

    test("formats undo_edit command", () => {
      const message = formatToolMessage(
        "str_replace_editor",
        { command: "undo_edit", path: "/App.jsx" },
        "in-progress"
      );
      expect(message).toBe("Undoing edit in /App.jsx");
    });

    test("handles missing path with fallback", () => {
      const message = formatToolMessage(
        "str_replace_editor",
        { command: "create" },
        "result",
        "File created"
      );
      expect(message).toBe("Created file");
    });

    test("handles unknown command with default message", () => {
      const message = formatToolMessage(
        "str_replace_editor",
        { command: "unknown", path: "/test.jsx" },
        "result",
        "Success"
      );
      expect(message).toBe("Modified /test.jsx");
    });
  });

  describe("file_manager tool", () => {
    test("formats rename command in progress", () => {
      const message = formatToolMessage(
        "file_manager",
        { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
        "in-progress"
      );
      expect(message).toBe("Renaming /old.jsx to /new.jsx");
    });

    test("formats rename command completed", () => {
      const message = formatToolMessage(
        "file_manager",
        { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
        "result",
        { success: true, message: "Successfully renamed" }
      );
      expect(message).toBe("Renamed /old.jsx to /new.jsx");
    });

    test("formats rename command with error", () => {
      const message = formatToolMessage(
        "file_manager",
        { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
        "result",
        { success: false, error: "Failed to rename" }
      );
      expect(message).toBe("Failed to rename /old.jsx");
    });

    test("formats delete command in progress", () => {
      const message = formatToolMessage(
        "file_manager",
        { command: "delete", path: "/unused.jsx" },
        "in-progress"
      );
      expect(message).toBe("Deleting /unused.jsx");
    });

    test("formats delete command completed", () => {
      const message = formatToolMessage(
        "file_manager",
        { command: "delete", path: "/unused.jsx" },
        "result",
        { success: true }
      );
      expect(message).toBe("Deleted /unused.jsx");
    });

    test("handles missing new_path in rename", () => {
      const message = formatToolMessage(
        "file_manager",
        { command: "rename", path: "/old.jsx" },
        "in-progress"
      );
      expect(message).toBe("Renaming /old.jsx");
    });
  });

  describe("unknown tools", () => {
    test("formats unknown tool name with underscores replaced", () => {
      const message = formatToolMessage(
        "custom_tool_name",
        {},
        "result",
        "Success"
      );
      expect(message).toBe("custom tool name");
    });
  });
});

describe("ToolCallBadge component", () => {
  test("renders creating message with spinner for in-progress state", () => {
    const toolInvocation: ToolInvocation = {
      toolCallId: "1",
      toolName: "str_replace_editor",
      args: { command: "create", path: "/App.jsx" },
      state: "in-progress",
    };

    const { container } = render(<ToolCallBadge toolInvocation={toolInvocation} />);

    expect(screen.getByText("Creating /App.jsx")).toBeDefined();
    expect(container.querySelector(".animate-spin")).toBeDefined();
  });

  test("renders created message with check icon for completed state", () => {
    const toolInvocation: ToolInvocation = {
      toolCallId: "1",
      toolName: "str_replace_editor",
      args: { command: "create", path: "/App.jsx" },
      state: "result",
      result: "File created: /App.jsx",
    };

    render(<ToolCallBadge toolInvocation={toolInvocation} />);

    expect(screen.getByText("Created /App.jsx")).toBeDefined();
  });

  test("renders error message with error icon for failed state", () => {
    const toolInvocation: ToolInvocation = {
      toolCallId: "1",
      toolName: "str_replace_editor",
      args: { command: "create", path: "/App.jsx" },
      state: "result",
      result: "Error: File already exists: /App.jsx",
    };

    const { container } = render(<ToolCallBadge toolInvocation={toolInvocation} />);

    expect(screen.getByText("Failed to create /App.jsx")).toBeDefined();
    expect(container.querySelector(".bg-red-50")).toBeDefined();
    expect(container.querySelector(".text-red-700")).toBeDefined();
  });

  test("renders editing message for str_replace command", () => {
    const toolInvocation: ToolInvocation = {
      toolCallId: "1",
      toolName: "str_replace_editor",
      args: {
        command: "str_replace",
        path: "/Card.jsx",
        old_str: "old",
        new_str: "new",
      },
      state: "result",
      result: "Replaced 1 occurrence(s)",
    };

    render(<ToolCallBadge toolInvocation={toolInvocation} />);

    expect(screen.getByText("Edited /Card.jsx")).toBeDefined();
  });

  test("renders renaming message with both paths", () => {
    const toolInvocation: ToolInvocation = {
      toolCallId: "1",
      toolName: "file_manager",
      args: { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
      state: "result",
      result: { success: true },
    };

    render(<ToolCallBadge toolInvocation={toolInvocation} />);

    expect(screen.getByText("Renamed /old.jsx to /new.jsx")).toBeDefined();
  });

  test("renders deleting message", () => {
    const toolInvocation: ToolInvocation = {
      toolCallId: "1",
      toolName: "file_manager",
      args: { command: "delete", path: "/unused.jsx" },
      state: "in-progress",
    };

    render(<ToolCallBadge toolInvocation={toolInvocation} />);

    expect(screen.getByText("Deleting /unused.jsx")).toBeDefined();
  });

  test("applies correct styling for error state", () => {
    const toolInvocation: ToolInvocation = {
      toolCallId: "1",
      toolName: "file_manager",
      args: { command: "delete", path: "/file.jsx" },
      state: "result",
      result: "Error: File not found",
    };

    const { container } = render(<ToolCallBadge toolInvocation={toolInvocation} />);

    const badge = container.querySelector(".bg-red-50");
    expect(badge).toBeDefined();
    expect(badge?.className).toContain("border-red-200");
  });

  test("applies correct styling for success state", () => {
    const toolInvocation: ToolInvocation = {
      toolCallId: "1",
      toolName: "str_replace_editor",
      args: { command: "create", path: "/App.jsx" },
      state: "result",
      result: "File created",
    };

    const { container } = render(<ToolCallBadge toolInvocation={toolInvocation} />);

    const badge = container.querySelector(".bg-neutral-50");
    expect(badge).toBeDefined();
    expect(badge?.className).toContain("border-neutral-200");
  });

  test("handles complex file paths", () => {
    const toolInvocation: ToolInvocation = {
      toolCallId: "1",
      toolName: "str_replace_editor",
      args: {
        command: "create",
        path: "/src/components/features/UserProfile.tsx",
      },
      state: "result",
      result: "File created",
    };

    render(<ToolCallBadge toolInvocation={toolInvocation} />);

    expect(
      screen.getByText("Created /src/components/features/UserProfile.tsx")
    ).toBeDefined();
  });

  test("handles empty args object gracefully", () => {
    const toolInvocation: ToolInvocation = {
      toolCallId: "1",
      toolName: "str_replace_editor",
      args: {},
      state: "result",
      result: "Success",
    };

    render(<ToolCallBadge toolInvocation={toolInvocation} />);

    expect(screen.getByText("Modified file")).toBeDefined();
  });
});
