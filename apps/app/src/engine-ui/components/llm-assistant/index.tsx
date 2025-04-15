"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Square, CornerDownLeft, Plus, X } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { useGameEditorStore } from "@/store/game-editor-store";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import LoadingDots from "./LoadingDots";
import MessageBubble from "./MessageBubble";
import ThreadSelector from "./ThreadSelector";
import type { UIMessage } from "ai";
import type { ChatThread } from "@/store/game-editor-store";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import type { GameFile } from "@/store/game-editor-store";
import { fetchGame } from "@/actions/game-actions";

interface ExtendedUIMessage extends UIMessage {
  error?: boolean;
  status?: string;
}

interface LLMAssistantProps {
  onClose: () => void;
  isDesktopPanel?: boolean;
}

export default function LLMAssistant({ isDesktopPanel = false }: LLMAssistantProps) {
  const { game, editor, setCurrentThread, setThreads, setGame } = useGameEditorStore();
  const currentThreadId = editor.currentThreadId;
  const [localThreads, setLocalThreads] = useState<ChatThread[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<GameFile[]>([]);
  const [filePopoverOpen, setFilePopoverOpen] = useState(false);
  const prevStatusRef = useRef<string | null>(null);

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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
    <div className="border-t p-2 bg-transparent sticky bottom-0 w-full">
      <div className="flex gap-2 mb-2 items-center">
        <Popover open={filePopoverOpen} onOpenChange={setFilePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="icon"
              className="h-6 w-6 p-0 flex items-center justify-center rounded-md border border-green-900/30 bg-zinc-900/50 text-green-700/80 hover:bg-green-900/10 ml-1"
              onClick={() => setFilePopoverOpen((v) => !v)}
              tabIndex={-1}
            >
              <Plus className="h-3 w-3 text-green-700/70" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-0 w-64 bg-background/60 backdrop-blur-md">
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
        <form
          onSubmit={handleSend}
          className="flex flex-col gap-2 p-2 border-t border-green-900/10 bg-zinc-900/40 backdrop-blur-md"
        >
          <Textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            placeholder="Ask the assistant..."
            className="resize-none min-h-[32px] max-h-28 text-xs bg-transparent dark:bg-transparent rounded-lg border-none focus:ring-0 focus:ring-green-400/20 focus-visible:outline-none"
            rows={1}
            autoFocus={isDesktopPanel}
            spellCheck={false}
          />
          <div className="flex justify-between items-center px-1">
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
        </form>
      </div>
    </div>
  );

  useEffect(() => {
    if (
      prevStatusRef.current === "streaming" &&
      status !== "streaming" &&
      game?.id
    ) {
      fetchGame(game.id)
        .then((freshGame) => setGame(freshGame))
        .catch(() => {});
    }
    prevStatusRef.current = status;
  }, [status, game?.id, setGame]);

  if (isDesktopPanel) {
    return (
      <div className={`flex flex-col h-full w-full rounded-xl bg-muted/20 backdrop-blur-md border border-border shadow-none`}> 
        <div className="p-2 pb-0">
          <ThreadSelector
            threads={localThreads}
            currentThreadId={currentThreadId}
            onSelectThread={handleSelectThread}
            onCreateThread={handleCreateThread}
          />
        </div>
        <ScrollArea className="flex-1 max-h-[calc(100dvh_-_320px)]">
          <div className="space-y-2 p-2">
            {isLoadingMessages ? (
              <div className="flex justify-center p-2">
                <LoadingDots />
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message as ExtendedUIMessage}
                  compact
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
    <div className={`flex flex-col h-full w-full bg-muted/20 backdrop-blur-md border border-border shadow-none text-xs`}>
      <div className="flex-1 flex flex-col">
        <div className="px-2 pt-2 pb-1">
          <ThreadSelector
            threads={localThreads}
            currentThreadId={currentThreadId}
            onSelectThread={handleSelectThread}
            onCreateThread={handleCreateThread}
          />
        </div>
        <ScrollArea className="flex-1 h-42">
          <div className="space-y-1 p-1">
            {isLoadingMessages ? (
              <div className="flex justify-center p-1">
                <LoadingDots />
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message as ExtendedUIMessage}
                  compact
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className="border-t border-border bg-muted/30 backdrop-blur-md p-0">
          <form
            onSubmit={handleSend}
            className="flex flex-col gap-1 px-0 py-1"
          >
            <Textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={onKeyDown}
              placeholder="Ask the assistant..."
              className="resize-none min-h-[28px] max-h-20 text-xs bg-transparent dark:bg-transparent border-none focus:ring-0 focus-visible:outline-none px-2 py-1"
              rows={1}
              autoFocus={isDesktopPanel}
              spellCheck={false}
            />
            {renderFilePills()}
            <div className="flex items-center justify-between w-full mt-0.5">
              <Popover open={filePopoverOpen} onOpenChange={setFilePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    className="h-6 w-6 p-0 flex items-center justify-center rounded-md border border-border bg-muted/30"
                    onClick={() => setFilePopoverOpen((v) => !v)}
                    tabIndex={-1}
                  >
                    <Plus className="h-3 w-3 text-green-900/40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0 w-64 border border-border bg-background/60">
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
              <Button
                size="icon"
                onClick={handleSend}
                disabled={
                  status === "error" ||
                  (!input.trim() && status !== "streaming") ||
                  !currentThreadId ||
                  isLoadingMessages
                }
                variant="default"
                className="h-6 w-6 p-0 flex items-center justify-center hover:bg-muted/40"
              >
                {status === "streaming" ? (
                  <Square className="h-3 w-3" />
                ) : (
                  <CornerDownLeft className="h-3 w-3" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
