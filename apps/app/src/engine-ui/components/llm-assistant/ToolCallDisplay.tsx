import { memo } from "react";

interface ToolCall {
  state: "partial-call" | "call" | "result";
  toolName: string;
}

const ToolCallDisplay = memo(({ toolCall }: { toolCall: ToolCall }) => {
  const isActive = toolCall.state !== "result";
  const isDone = toolCall.state === "result";

  return (
    <div className="text-xs text-muted-foreground mt-1">
      {isActive && <span className="animate-pulse">using {toolCall.toolName}</span>}
      {isDone && <span>done {toolCall.toolName}</span>}
    </div>
  );
});

ToolCallDisplay.displayName = "ToolCallDisplay";

export default ToolCallDisplay; 