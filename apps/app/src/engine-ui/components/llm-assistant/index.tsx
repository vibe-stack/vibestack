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
  ChevronUp
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
    icon: any;
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

const MessageBubble = memo(({ message }: { message: ExtendedUIMessage }) => {
  const [showReasoning, setShowReasoning] = useState(false);
  const reasoning = message.parts?.find(
    (part) => part.type === "reasoning"
  )?.reasoning;

  const isError = message.role === "assistant" && message.error;

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
        {reasoning && (
          <div className="mb-2">
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
                {reasoning}
              </div>
            )}
          </div>
        )}

        {message.status === "submitted" ? (
          <LoadingDots />
        ) : (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";

export default function LLMAssistant({
  isDesktopPanel = false,
}: LLMAssistantProps) {
  const { game } = useGameEditorStore();
  const { messages, input, handleInputChange, handleSubmit, status, stop } =
    useChat({
      api: `/api/games/${game?.id}/chat/912831`,
    });
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
              status === "error" || (!input.trim() && status !== "streaming")
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
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message as ExtendedUIMessage}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      {renderChatControls()}
    </>
  );

  if (isDesktopPanel) {
    return (
      <div className="flex flex-col h-full bg-background">
        <ScrollArea className="flex-1 max-h-[calc(100dvh_-_310px)]">
          <div className="space-y-4 p-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message as ExtendedUIMessage}
              />
            ))}
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
