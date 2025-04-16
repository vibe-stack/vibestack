"use client"

import { useGameEditorStore } from "@/store/game-editor-store"
import { Button } from "@/components/ui/button"
import { Plus, EllipsisVertical, ClipboardCopy, Trash2, MessageCircle, File as FileIcon, FolderOpen } from "lucide-react"
import { useState } from "react"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { createGameFile, deleteGameFile } from "@/actions/game-actions"

function FileContextMenu({ onOpen, onSendToChat, onCopyName, onCopyPath, onDelete }: {
  onOpen: () => void
  onSendToChat: () => void
  onCopyName: () => void
  onCopyPath: () => void
  onDelete: () => void
}) {
  return (
    <>
      <ContextMenuItem onClick={onOpen}>
        <FolderOpen className="w-4 h-4 mr-2" />Open
      </ContextMenuItem>
      <ContextMenuItem onClick={onSendToChat} disabled>
        <MessageCircle className="w-4 h-4 mr-2" />Send to Chat
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={onCopyName}>
        <ClipboardCopy className="w-4 h-4 mr-2" />Copy Name
      </ContextMenuItem>
      <ContextMenuItem onClick={onCopyPath}>
        <ClipboardCopy className="w-4 h-4 mr-2" />Copy Path
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={onDelete} variant="destructive">
        <Trash2 className="w-4 h-4 mr-2" />Delete
      </ContextMenuItem>
    </>
  )
}

export default function FilesPanel() {
  const {
    game,
    editor: { activeFileId },
    setActiveFile,
    setError,
    refreshGame,
  } = useGameEditorStore()

  const [popoverOpen, setPopoverOpen] = useState(false)
  const [newFileName, setNewFileName] = useState("")
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleCreateFile = async () => {
    if (!game || !newFileName.trim()) return
    setCreating(true)
    try {
      const fileType = newFileName.split('.').pop() || "txt"
      await createGameFile(game.id, newFileName, fileType, " ")
      await refreshGame()
      setPopoverOpen(false)
      setNewFileName("")
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message || "Failed to create file")
      } else {
        setError("Failed to create file")
      }
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    setDeletingId(fileId)
    try {
      await deleteGameFile(fileId)
      await refreshGame()
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message || "Failed to delete file")
      } else {
        setError("Failed to delete file")
      }
    } finally {
      setDeletingId(null)
    }
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {}
  }

  const handleSendToChat = () => {
    // TODO: Implement or connect to chat logic
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 flex items-center justify-between">
        <span className="font-medium text-xs tracking-tight text-zinc-300">Files</span>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              disabled={creating}
              aria-label="Create new file"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-4">
            <form
              onSubmit={e => {
                e.preventDefault()
                handleCreateFile()
              }}
              className="flex flex-col gap-3"
            >
              <Input
                autoFocus
                placeholder="Enter file name (with extension)"
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                disabled={creating}
                onKeyDown={e => {
                  if (e.key === "Escape") {
                    setPopoverOpen(false)
                    setNewFileName("")
                  }
                }}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPopoverOpen(false)
                    setNewFileName("")
                  }}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={creating || !newFileName.trim()}
                >
                  Create
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {game && Array.isArray(game.files) && game.files.length > 0 ? (
          <div className="space-y-0.5">
            {game.files.map((file) => {
              const onOpen = () => setActiveFile(file.id)
              const onSendToChat = () => handleSendToChat()
              const onCopyName = () => handleCopy(file.path.split("/").pop() || file.path)
              const onCopyPath = () => handleCopy(file.path)
              const onDelete = () => handleDeleteFile(file.id)
              return (
                <ContextMenu key={file.id}>
                  <ContextMenuTrigger asChild>
                    <div
                      className={`group flex items-center px-2 py-1 rounded-lg cursor-pointer transition-all duration-150 text-xs ${
                        activeFileId === file.id
                          ? "bg-green-900/20 border border-green-400/20 shadow-[0_2px_8px_0_rgba(16,255,120,0.04)] text-green-100"
                          : "hover:bg-zinc-800/30"
                      }`}
                      onClick={onOpen}
                    >
                      <span className="truncate flex-1 flex items-center gap-2">
                        <FileIcon className="w-4 h-4 text-green-900/40 shrink-0" />
                        {file.path}
                      </span>
                      <button
                        className={`ml-2 p-1 rounded hover:bg-zinc-700/60 transition-opacity opacity-0 group-hover:opacity-100 ${deletingId === file.id ? "animate-pulse" : ""}`}
                        tabIndex={-1}
                        onClick={e => {
                          e.stopPropagation();
                        }}
                        aria-label="Show file actions"
                      >
                        <EllipsisVertical className="w-4 h-4 text-zinc-400" />
                      </button>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent onClick={e => e.stopPropagation()}>
                    <FileContextMenu
                      onOpen={onOpen}
                      onSendToChat={onSendToChat}
                      onCopyName={onCopyName}
                      onCopyPath={onCopyPath}
                      onDelete={onDelete}
                    />
                  </ContextMenuContent>
                </ContextMenu>
              )
            })}
          </div>
        ) : (
          <div className="text-zinc-500 text-sm flex items-center justify-center h-full">No files</div>
        )}
      </div>
    </div>
  )
} 