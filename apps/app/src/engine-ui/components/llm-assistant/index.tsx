"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Code,
  ImageIcon,
  Square,
  CornerDownLeft,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useChat } from "@ai-sdk/react";
import { useGameEditorStore } from "@/store/game-editor-store";
import { Textarea } from "@/components/ui/textarea";
import type { UIMessage } from "ai";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatThread } from "@/store/game-editor-store";

type Mode = "chat" | "generate" | "code" | "image";
type LLMProvider = "grok3" | "claude3" | "gpt4";

// Extend UIMessage to include the properties we need
interface ExtendedUIMessage extends UIMessage {
  error?: boolean;
  status?: string;
}

interface LLMAssistantProps {
  onClose: () => void;
  isDesktopPanel?: boolean;
}

// Define the shape of a tool call for TypeScript
interface ToolCall {
  state: "partial-call" | "call" | "result";
  toolName: string;
}

const ModeButton = memo(
  ({
    mode,
    currentMode,
    icon: Icon,
    label,
    onClick,
  }: {
    mode: Mode;
    currentMode: Mode;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
  }) => (
    <Button
      variant={mode === currentMode ? "default" : "outline"}
      size="sm"
      className="h-8"
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5 mr-1" />
      {label}
    </Button>
  )
);

ModeButton.displayName = "ModeButton";

const LoadingDots = () => (
  <div className="flex space-x-1 my-1">
    {[0, 1, 2].map((dot) => (
      <motion.div
        key={dot}
        className="h-1.5 w-1.5 bg-foreground rounded-full"
        animate={{ y: [0, -3, 0] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          repeatType: "loop",
          delay: dot * 0.2,
        }}
      />
    ))}
  </div>
);

const ToolCallDisplay = memo(({ toolCall }: { toolCall: ToolCall }) => {
  const isActive = toolCall.state !== "result";
  const isDone = toolCall.state === "result";

  return (
    <div className="text-xs text-muted-foreground mt-1">
      {isActive && (
        <span className="animate-pulse">using {toolCall.toolName}</span>
      )}
      {isDone && <span>done {toolCall.toolName}</span>}
    </div>
  );
});

ToolCallDisplay.displayName = "ToolCallDisplay";

const MessageBubble = memo(({ message }: { message: ExtendedUIMessage }) => {
  const [showReasoning, setShowReasoning] = useState(false);
  const isError = message.role === "assistant" && message.error;

  // Render different part types
  // Using unknown type for message parts since we don't have access to the exact type definitions from the ai package
  const renderPart = (part: unknown, index: number) => {
    // Type assertion to access part properties
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
          <p key={index} className="text-sm whitespace-pre-wrap">
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
        return (
          <ToolCallDisplay key={index} toolCall={typedPart.toolInvocation as ToolCall} />
        );
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
    <div
      className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`max-w-full rounded-lg p-3 ${
          message.role === "assistant"
            ? isError
              ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300"
              : "bg-transparent"
            : "bg-muted"
        }`}
      >
        {message.status === "submitted" ? (
          <LoadingDots />
        ) : (
          <>
            {message.parts && message.parts.length > 0 ? (
              message.parts.map(renderPart)
            ) : (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";

// Thread selector component
const ThreadSelector = memo(
  ({
    threads,
    currentThreadId,
    onSelectThread,
    onCreateThread,
  }: {
    threads: { id: string; title: string }[];
    currentThreadId: string | null;
    onSelectThread: (threadId: string) => void;
    onCreateThread: () => void;
  }) => (
    <div className="flex items-center gap-2 mb-2">
      <Select
        value={currentThreadId || undefined}
        onValueChange={onSelectThread}
      >
        <SelectTrigger className="w-full h-8">
          <SelectValue placeholder="Select a thread" />
        </SelectTrigger>
        <SelectContent>
          {threads.map((thread) => (
            <SelectItem key={thread.id} value={thread.id}>
              {thread.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-2"
        onClick={onCreateThread}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
);

ThreadSelector.displayName = "ThreadSelector";

export default function LLMAssistant({
  isDesktopPanel = false,
}: LLMAssistantProps) {
  const { game, editor, setCurrentThread, setThreads } = useGameEditorStore();

  const currentThreadId = editor.currentThreadId;
  const [localThreads, setLocalThreads] = useState<ChatThread[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    if (game?.threads) {
      setLocalThreads(game.threads);
    }
  }, [game?.threads]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop,
    setMessages,
  } = useChat({
    api: `/api/games/${game?.id}/chat/${currentThreadId}`,
    id: currentThreadId || undefined,
    initialMessages: [],
  });

  // Fetch messages when thread changes
  useEffect(() => {
    async function fetchMessages() {
      if (!game?.id || !currentThreadId) return;

      // Clear existing messages first to prevent duplicates 
      setMessages([]);
      
      const abortController = new AbortController();
      setIsLoadingMessages(true);
      try {
        const response = await fetch(
          `/api/games/${game.id}/chat/${currentThreadId}/messages`,
          { signal: abortController.signal }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.statusText}`);
        }

        const data = await response.json();
        setMessages(data.messages || []);
      } catch (error: unknown) {
        if ((error as Error).name === 'AbortError') {
          console.log("Fetch aborted");
        } else {
          console.error("Error fetching thread messages:", error);
        }
      } finally {
        setIsLoadingMessages(false);
      }

      return () => {
        abortController.abort();
      };
    }

    const cancel = fetchMessages();
    return () => {
      const fn = async () => {
        const abort = await cancel;
        abort?.();
      }
      fn()
    }
  }, [game?.id, currentThreadId, setMessages]);

  const [mode, setMode] = useState<Mode>("chat");
  const [isExpanded, setIsExpanded] = useState(false);
  const [provider, setProvider] = useState<LLMProvider>("grok3");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleModeChange = useCallback((newMode: Mode) => {
    setMode(newMode);
  }, []);

  const handleExpand = useCallback(() => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    },
    [handleSubmit]
  );

  const handleAction = useCallback(
    (e: React.FormEvent) => {
      if (status === "streaming") {
        stop();
      } else {
        handleSubmit(e);
      }
    },
    [status, stop, handleSubmit]
  );

  const handleCreateThread = useCallback(async () => {
    if (!game) return;

    const title = `Thread ${localThreads.length + 1}`;

    try {
      // Make the API call directly
      const response = await fetch(`/api/games/${game.id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error("Failed to create thread");
      }

      const thread = await response.json();

      // Update the local threads state
      const newThread: ChatThread = {
        id: thread.id,
        title: thread.title || title,
        createdAt: new Date(thread.createdAt || Date.now()),
      };

      const updatedThreads = [...localThreads, newThread];
      setLocalThreads(updatedThreads);

      // Update the global store
      setThreads(updatedThreads);

      // Set as active thread
      setCurrentThread(thread.id);
    } catch (error) {
      console.error("Error creating thread:", error);
    }
  }, [game, localThreads, setCurrentThread, setThreads]);

  const handleSelectThread = useCallback(
    (threadId: string) => {
      setCurrentThread(threadId);
    },
    [setCurrentThread]
  );

  const renderChatControls = () => (
    <div className="border-t p-3 bg-background sticky bottom-0 w-full">
      <div className="flex gap-2 mb-2">
        <ModeButton
          mode="generate"
          currentMode={mode}
          icon={Sparkles}
          label="Ask"
          onClick={() => handleModeChange("generate")}
        />
        <ModeButton
          mode="code"
          currentMode={mode}
          icon={Code}
          label="Code"
          onClick={() => handleModeChange("code")}
        />
        <ModeButton
          mode="image"
          currentMode={mode}
          icon={ImageIcon}
          label="Image"
          onClick={() => handleModeChange("image")}
        />
      </div>
      <div className="bg-muted/50 p-2 rounded-lg">
        <Textarea
          ref={inputRef}
          placeholder="What are we vibing today?"
          value={input}
          rows={2}
          onChange={handleInputChange}
          onKeyDown={onKeyDown}
          className="w-full mb-2 border-none bg-white focus:outline-none"
          style={{ maxHeight: "150px", overflowY: "auto" }}
        />
        <div className="flex justify-between items-center px-1">
          <Select
            value={provider}
            onValueChange={(value) => setProvider(value as LLMProvider)}
          >
            <SelectTrigger className="w-32 h-4 text-xs">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grok3">Grok 3</SelectItem>
              <SelectItem value="claude3">Claude 3</SelectItem>
              <SelectItem value="gpt4">GPT-4</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleAction}
            disabled={
              status === "error" ||
              (!input.trim() && status !== "streaming") ||
              !currentThreadId ||
              isLoadingMessages
            }
            variant="ghost"
            className="h-7 px-2 hover:bg-white/5"
          >
            {status === "streaming" ? (
              <Square className="h-3.5 w-3.5" />
            ) : (
              <>
                <span className="text-xs">Send</span>
                <CornerDownLeft className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderChatContent = () => (
    <>
      <div className="p-3">
        <ThreadSelector
          threads={localThreads}
          currentThreadId={currentThreadId}
          onSelectThread={handleSelectThread}
          onCreateThread={handleCreateThread}
        />
      </div>
      <ScrollArea className="flex-1 h-42">
        <div className="space-y-4 p-4">
          {isLoadingMessages ? (
            <div className="flex justify-center p-4">
              <LoadingDots />
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message as ExtendedUIMessage}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      {renderChatControls()}
    </>
  );

  if (isDesktopPanel) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="p-3">
          <ThreadSelector
            threads={localThreads}
            currentThreadId={currentThreadId}
            onSelectThread={handleSelectThread}
            onCreateThread={handleCreateThread}
          />
        </div>
        <ScrollArea className="flex-1 max-h-[calc(100dvh_-_390px)]">
          <div className="space-y-4 p-4">
            {isLoadingMessages ? (
              <div className="flex justify-center p-4">
                <LoadingDots />
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message as ExtendedUIMessage}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        {renderChatControls()}
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col h-full bg-background"
      initial={{ height: "60px" }}
      animate={{ height: isExpanded ? "400px" : "60px" }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
    >
      <div
        className="flex items-center justify-center p-2 cursor-grab active:cursor-grabbing"
        onMouseDown={handleExpand}
      >
        <div className="w-12 h-1 rounded-full bg-muted" />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {renderChatContent()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
