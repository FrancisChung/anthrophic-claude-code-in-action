import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

// ===== str_replace_editor tests =====

test("displays 'Creating filename' for str_replace_editor create command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "call",
      }}
    />
  );

  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("displays 'Editing filename' for str_replace_editor str_replace command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "str_replace", path: "/components/Button.tsx" },
        state: "call",
      }}
    />
  );

  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
});

test("displays 'Editing filename' for str_replace_editor insert command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "insert", path: "/index.ts" },
        state: "call",
      }}
    />
  );

  expect(screen.getByText("Editing index.ts")).toBeDefined();
});

test("displays 'Viewing filename' for str_replace_editor view command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "view", path: "/utils/helpers.ts" },
        state: "call",
      }}
    />
  );

  expect(screen.getByText("Viewing helpers.ts")).toBeDefined();
});

test("displays 'Undoing edit on filename' for undo_edit command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "undo_edit", path: "/App.jsx" },
        state: "call",
      }}
    />
  );

  expect(screen.getByText("Undoing edit on App.jsx")).toBeDefined();
});

// ===== file_manager tests =====

test("displays 'Renaming filename' for file_manager rename command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "file_manager",
        args: { command: "rename", path: "/old-name.tsx", new_path: "/new-name.tsx" },
        state: "call",
      }}
    />
  );

  expect(screen.getByText("Renaming old-name.tsx")).toBeDefined();
});

test("displays 'Deleting filename' for file_manager delete command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "file_manager",
        args: { command: "delete", path: "/temp.ts" },
        state: "call",
      }}
    />
  );

  expect(screen.getByText("Deleting temp.ts")).toBeDefined();
});

// ===== State indicator tests =====

test("shows loading spinner when state is 'call'", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "call",
      }}
    />
  );

  const spinner = container.querySelector(".animate-spin");
  expect(spinner).not.toBeNull();
});

test("shows loading spinner for partial-call state", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "partial-call",
      }}
    />
  );

  const spinner = container.querySelector(".animate-spin");
  expect(spinner).not.toBeNull();
});

test("shows green dot when state is 'result' with result value", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "result",
        result: "File created successfully",
      }}
    />
  );

  const greenDot = container.querySelector(".bg-emerald-500");
  expect(greenDot).not.toBeNull();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows loading spinner when state is 'result' but result is undefined", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "result",
        result: undefined,
      }}
    />
  );

  const spinner = container.querySelector(".animate-spin");
  expect(spinner).not.toBeNull();
});

// ===== Fallback tests =====

test("falls back to tool name for unknown tools", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "unknown_tool",
        args: { some: "args" },
        state: "call",
      }}
    />
  );

  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("falls back to 'Working on file' when str_replace_editor command is unknown", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "unknown_command", path: "/test.tsx" },
        state: "call",
      }}
    />
  );

  expect(screen.getByText("Working on test.tsx")).toBeDefined();
});

test("falls back to 'Managing file' when file_manager command is unknown", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "file_manager",
        args: { command: "unknown_command", path: "/test.tsx" },
        state: "call",
      }}
    />
  );

  expect(screen.getByText("Managing test.tsx")).toBeDefined();
});

test("handles missing path in args gracefully", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create" },
        state: "call",
      }}
    />
  );

  expect(screen.getByText("Creating file")).toBeDefined();
});

test("handles empty args object gracefully", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: {},
        state: "call",
      }}
    />
  );

  expect(screen.getByText("Working on file")).toBeDefined();
});

test("handles undefined args gracefully", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: undefined as unknown as Record<string, unknown>,
        state: "call",
      }}
    />
  );

  expect(screen.getByText("Working on file")).toBeDefined();
});

// ===== Path extraction tests =====

test("extracts filename from deep nested path", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/src/components/ui/buttons/PrimaryButton.tsx" },
        state: "call",
      }}
    />
  );

  expect(screen.getByText("Creating PrimaryButton.tsx")).toBeDefined();
});

test("handles path without leading slash", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "App.jsx" },
        state: "call",
      }}
    />
  );

  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

// ===== Styling tests =====

test("applies correct base styling classes", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "call",
      }}
    />
  );

  const badge = container.firstChild as HTMLElement;
  expect(badge.className).toContain("inline-flex");
  expect(badge.className).toContain("items-center");
  expect(badge.className).toContain("gap-2");
  expect(badge.className).toContain("bg-neutral-50");
  expect(badge.className).toContain("rounded-lg");
  expect(badge.className).toContain("text-xs");
  expect(badge.className).toContain("font-mono");
});
