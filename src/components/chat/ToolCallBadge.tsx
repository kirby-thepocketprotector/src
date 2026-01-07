import { Loader2, FileCheck, AlertCircle } from "lucide-react";

interface StrReplaceArgs {
  command: "view" | "create" | "str_replace" | "insert" | "undo_edit";
  path: string;
  file_text?: string;
  insert_line?: number;
  new_str?: string;
  old_str?: string;
  view_range?: number[];
}

interface FileManagerArgs {
  command: "rename" | "delete";
  path: string;
  new_path?: string;
}

export interface ToolInvocation {
  toolCallId: string;
  args: StrReplaceArgs | FileManagerArgs | Record<string, any>;
  toolName: string;
  state: string;
  result?: any;
}

export interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

function isError(result: any): boolean {
  if (typeof result === "string" && result.startsWith("Error:")) {
    return true;
  }
  if (typeof result === "object" && result?.success === false) {
    return true;
  }
  return false;
}

function getFileName(path: string | undefined): string {
  if (!path) return "file";
  return path;
}

export function formatToolMessage(
  toolName: string,
  args: any,
  state: string,
  result?: any
): string {
  const isComplete = state === "result" && result;
  const hasError = isComplete && isError(result);

  if (toolName === "str_replace_editor") {
    const { command, path } = args as StrReplaceArgs;
    const fileName = getFileName(path);

    switch (command) {
      case "create":
        if (hasError) return `Failed to create ${fileName}`;
        return isComplete ? `Created ${fileName}` : `Creating ${fileName}`;

      case "str_replace":
      case "insert":
        if (hasError) return `Failed to edit ${fileName}`;
        return isComplete ? `Edited ${fileName}` : `Editing ${fileName}`;

      case "view":
        if (hasError) return `Failed to view ${fileName}`;
        return isComplete ? `Viewed ${fileName}` : `Viewing ${fileName}`;

      case "undo_edit":
        if (hasError) return `Failed to undo edit in ${fileName}`;
        return isComplete
          ? `Undid edit in ${fileName}`
          : `Undoing edit in ${fileName}`;

      default:
        return isComplete ? `Modified ${fileName}` : `Modifying ${fileName}`;
    }
  }

  if (toolName === "file_manager") {
    const { command, path, new_path } = args as FileManagerArgs;
    const fileName = getFileName(path);

    switch (command) {
      case "rename":
        if (hasError) return `Failed to rename ${fileName}`;
        if (isComplete && new_path) {
          return `Renamed ${fileName} to ${new_path}`;
        }
        return new_path
          ? `Renaming ${fileName} to ${new_path}`
          : `Renaming ${fileName}`;

      case "delete":
        if (hasError) return `Failed to delete ${fileName}`;
        return isComplete ? `Deleted ${fileName}` : `Deleting ${fileName}`;

      default:
        return isComplete ? `Modified ${fileName}` : `Modifying ${fileName}`;
    }
  }

  return toolName.replace(/_/g, " ");
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const message = formatToolMessage(
    toolInvocation.toolName,
    toolInvocation.args,
    toolInvocation.state,
    toolInvocation.result
  );

  const isComplete = toolInvocation.state === "result" && toolInvocation.result;
  const hasError = isComplete && isError(toolInvocation.result);

  return (
    <div
      className={`inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg text-xs border ${
        hasError
          ? "bg-red-50 border-red-200"
          : "bg-neutral-50 border-neutral-200"
      }`}
    >
      {hasError ? (
        <>
          <AlertCircle className="w-3 h-3 text-red-600" />
          <span className="text-red-700 font-medium">{message}</span>
        </>
      ) : isComplete ? (
        <>
          <FileCheck className="w-3 h-3 text-emerald-600" />
          <span className="text-neutral-700">{message}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{message}</span>
        </>
      )}
    </div>
  );
}
