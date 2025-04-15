import { memo } from "react";
import { Loader2, CheckIcon } from "lucide-react";

interface ToolCall {
  state: "partial-call" | "call" | "result";
  toolName: string;
}

const ToolCallDisplay = memo(({ toolCall }: { toolCall: ToolCall }) => {
  const isActive = toolCall.state !== "result";
  const isDone = toolCall.state === "result";

  return (
    <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
      {isActive && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>{toolCall.toolName}</span>
        </>
      )}
      {isDone && (
        <>
          <CheckIcon className="h-3 w-3 text-green-500" />
          <span>{toolCall.toolName}</span>
        </>
      )}
    </div>
  );
});

ToolCallDisplay.displayName = "ToolCallDisplay";

export default ToolCallDisplay; 