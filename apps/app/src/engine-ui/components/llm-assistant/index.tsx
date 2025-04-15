"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Square, CornerDownLeft, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useChat } from "@ai-sdk/react";
import { useGameEditorStore } from "@/store/game-editor-store";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import LoadingDots from "./LoadingDots";
import MessageBubble from "./MessageBubble";
import ThreadSelector from "./ThreadSelector";
import type { LLMProvider } from "./types";
import type { UIMessage } from "ai";
import type { ChatThread } from "@/store/game-editor-store";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import type { GameFile } from "@/store/game-editor-store";

interface ExtendedUIMessage extends UIMessage {
  error?: boolean;
  status?: string;
}

interface LLMAssistantProps {
  onClose: () => void;
  isDesktopPanel?: boolean;
}

export default function LLMAssistant({ isDesktopPanel = false }: LLMAssistantProps) {
  const { game, editor, setCurrentThread, setThreads } = useGameEditorStore();
  const currentThreadId = editor.currentThreadId;
  const [localThreads, setLocalThreads] = useState<ChatThread[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<GameFile[]>([]);
  const [filePopoverOpen, setFilePopoverOpen] = useState(false);

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

  useEffect(() => {
    async function fetchMessages() {
      if (!game?.id || !currentThreadId) return;
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
        const message = (typeof error === "object" && error && "message" in error) ? (error as { message?: string }).message : "Unknown error";
        toast.error("Error fetching thread messages: " + (message || "Unknown error"));
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
      };
      fn();
    };
  }, [game?.id, currentThreadId, setMessages]);

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

  const handleCreateThread = useCallback(async () => {
    if (!game) return;
    const title = `Thread ${localThreads.length + 1}`;
    try {
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
      const newThread: ChatThread = {
        id: thread.id,
        title: thread.title || title,
        createdAt: new Date(thread.createdAt || Date.now()),
      };
      const updatedThreads = [...localThreads, newThread];
      setLocalThreads(updatedThreads);
      setThreads(updatedThreads);
      setCurrentThread(thread.id);
    } catch (error: unknown) {
      const message = (typeof error === "object" && error && "message" in error) ? (error as { message?: string }).message : "Unknown error";
      toast.error("Error creating thread: " + (message || "Unknown error"));
    }
  }, [game, localThreads, setCurrentThread, setThreads]);

  const handleSelectThread = useCallback(
    (threadId: string) => {
      setCurrentThread(threadId);
    },
    [setCurrentThread]
  );

  const handleAddFile = (fileId: string) => {
    if (!game) return;
    const file = game.files.find(f => f.id === fileId);
    if (!file) return;
    setAttachedFiles(prev => prev.some(f => f.id === fileId) ? prev : [...prev, file]);
    setFilePopoverOpen(false);
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const getFilesSystemPrompt = () => {
    if (attachedFiles.length === 0) return null;
    const fileList = attachedFiles.map((f) => f.path).join(", ");
    const fileDetails = attachedFiles.map((f) => `File: ${f.path}\nContent:\n${f.content}`).join("\n\n");
    return `The user attached ${attachedFiles.length} files: ${fileList}\n\n${fileDetails}`;
  };

  const handleSend = useCallback(
    (e: React.FormEvent) => {
      if (status === "streaming") {
        stop();
        return;
      }
      const systemPrompt = getFilesSystemPrompt();
      let newMessages = [...messages];
      if (systemPrompt) {
        newMessages = [
          ...messages,
          {
            id: `system-files-${Date.now()}`,
            role: "system",
            content: systemPrompt,
            parts: [],
          },
        ];
      }
      setMessages(newMessages);
      handleSubmit(e);
      setAttachedFiles([]);
    },
    [status, stop, handleSubmit, getFilesSystemPrompt, setMessages, messages]
  );

  const renderFilePills = () => (
    <div className="flex gap-2 flex-wrap mb-2">
      {attachedFiles.map((file) => (
        <div key={file.id} className="flex items-center bg-muted/50 rounded px-2 py-1 text-xs">
          <span className="font-mono truncate max-w-[120px]">{file.path}</span>
          <button
            type="button"
            className="ml-1 text-muted-foreground hover:text-foreground"
            onClick={() => handleRemoveFile(file.id)}
            aria-label="Remove file"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );

  const renderChatControls = () => (
    <div className="border-t p-3 bg-background sticky bottom-0 w-full">
      <div className="flex gap-2 mb-2 items-center">
        <Popover open={filePopoverOpen} onOpenChange={setFilePopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-center w-8 h-8 rounded bg-muted/50 hover:bg-muted"
              aria-label="Attach file"
            >
              <Plus className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-0 w-64">
            <div className="max-h-60 overflow-y-auto divide-y divide-muted-foreground/10">
              {game?.files && game.files.length > 0 ? (
                game.files.map((file) => (
                  <button
                    key={file.id}
                    className="w-full text-left px-4 py-2 hover:bg-muted/50 text-xs font-mono truncate"
                    onClick={() => handleAddFile(file.id)}
                    disabled={attachedFiles.some(f => f.id === file.id)}
                  >
                    {file.path}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-xs text-muted-foreground">No files in project</div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <div className="flex-1">{renderFilePills()}</div>
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
            onClick={handleSend}
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
