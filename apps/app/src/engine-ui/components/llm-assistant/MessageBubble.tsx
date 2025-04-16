import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import ToolCallDisplay from "./ToolCallDisplay";

interface ToolCall {
  state: "partial-call" | "call" | "result";
  toolName: string;
}

interface ExtendedUIMessage {
  id?: string;
  role: string;
  error?: boolean;
  status?: string;
  parts?: unknown[];
  content?: string;
}

const MessageBubble = ({ message, compact = false }: { message: ExtendedUIMessage; compact?: boolean }) => {
  const [showReasoning, setShowReasoning] = useState(false);
  const isError = message.role === "assistant" && message.error;

  const renderPart = (part: unknown, index: number) => {
    const typedPart = part as {
      type: string;
      text?: string;
      reasoning?: string;
      toolInvocation?: ToolCall;
      source?: string;
      file?: string;
      stepStart?: string;
    };

    switch (typedPart.type) {
      case "text":
        return (
          <p key={index} className={`${compact ? "text-xs" : "text-sm"} whitespace-pre-wrap`}>
            {typedPart.text}
          </p>
        );
      case "reasoning":
        return (
          <div key={index} className="mb-2">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Thinking</span>
              {showReasoning ? (
                <ChevronUp className="h-3 w-3 ml-1" />
              ) : (
                <ChevronDown className="h-3 w-3 ml-1" />
              )}
            </button>
            {showReasoning && (
              <div className="mt-1 text-xs text-muted-foreground border-l-2 border-muted pl-2 whitespace-pre-wrap">
                {typedPart.reasoning}
              </div>
            )}
          </div>
        );
      case "tool-invocation":
        return <ToolCallDisplay key={index} toolCall={typedPart.toolInvocation as ToolCall} />;
      case "source":
        return (
          <div key={index} className="text-xs text-muted-foreground mt-1">
            <span>Source: {typedPart.source}</span>
          </div>
        );
      case "file":
        return (
          <div key={index} className="text-xs bg-muted/50 p-2 rounded mt-1">
            <div className="font-mono">{typedPart.file}</div>
          </div>
        );
      case "step-start":
        return (
          <div key={index} className="text-xs text-muted-foreground mt-1">
            <span>{typedPart.stepStart}</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-full rounded-md ${compact ? "p-2 text-xs" : "p-2 text-xs"} ${
          message.role === "assistant"
            ? isError
              ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300 border border-red-300/40"
              : "bg-transparent text-muted-foreground"
            : "bg-muted/60 border border-border text-foreground"
        }`}
      >
        {message.status === "submitted" ? (
          <></>
        ) : (message.role === "system" || message.role === "user") && message.content === "ATTACHED_FILES" && Array.isArray(message.parts) ? (
          <p className={`${compact ? "text-xs" : "text-xs"} whitespace-pre-wrap`}>
            {`You attached ${message.parts.length} file${message.parts.length === 1 ? "" : "s"} (`}
            {message.parts
              .map((part) =>
                typeof part === "object" && part && "content" in part && typeof (part as { content: string }).content === "string"
                  ? (part as { content: string }).content.split("\n")[0]
                  : ""
              )
              .filter(Boolean)
              .join(", ")}
            {`).`}
          </p>
        ) : message.parts && message.parts.length > 0 ? (
          <>
            {message.parts.map(renderPart)}
          </>
        ) : (
          <p className={`${compact ? "text-xs" : "text-xs"} whitespace-pre-wrap`}>{message.content}</p>
        )}
      </div>
    </div>
  );
};

export default MessageBubble; 