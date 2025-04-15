"use client"

import { useGameEditorStore } from "@/store/game-editor-store"
import { Button } from "@/components/ui/button"
import { Plus, EllipsisVertical, ClipboardCopy, Trash2, MessageCircle, File as FileIcon, FolderOpen } from "lucide-react"
import { useState } from "react"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from "@/components/ui/context-menu"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

function FileMenu({ onOpen, onSendToChat, onCopyName, onCopyPath, onDelete }: {
  onOpen: () => void
  onSendToChat: () => void
  onCopyName: () => void
  onCopyPath: () => void
  onDelete: () => void
}) {
  return (
    <>
      <DropdownMenuItem onClick={onOpen}>
        <FolderOpen className="w-4 h-4 mr-2" />Open
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onSendToChat}>
        <MessageCircle className="w-4 h-4 mr-2" />Send to Chat
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onCopyName}>
        <ClipboardCopy className="w-4 h-4 mr-2" />Copy Name
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onCopyPath}>
        <ClipboardCopy className="w-4 h-4 mr-2" />Copy Path
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onDelete} className="text-red-600">
        <Trash2 className="w-4 h-4 mr-2" />Delete
      </DropdownMenuItem>
    </>
  )
}

export default function FilesPanel() {
  const {
    game,
    editor: { activeFileId },
    setActiveFile,
    addFile,
    removeFile,
  } = useGameEditorStore()

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [newFileName, setNewFileName] = useState("")
  const [creating, setCreating] = useState(false)

  const handleCreateFile = async () => {
    if (!game || !newFileName.trim()) return
    setCreating(true)
    try {
      const fileType = newFileName.split('.').pop() || "txt"
      const newFile = {
        id: Math.random().toString(36).slice(2),
        path: newFileName,
        type: fileType,
        content: "",
        lastModified: new Date(),
      }
      addFile(newFile)
      setPopoverOpen(false)
      setNewFileName("")
    } finally {
      setCreating(false)
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
        {game?.files.length ? (
          <div className="space-y-0.5">
            {game.files.map((file) => {
              const onOpen = () => setActiveFile(file.id)
              const onSendToChat = () => handleSendToChat()
              const onCopyName = () => handleCopy(file.path.split("/").pop() || file.path)
              const onCopyPath = () => handleCopy(file.path)
              const onDelete = () => removeFile(file.id)
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
                      <DropdownMenu open={menuOpenId === file.id} onOpenChange={open => setMenuOpenId(open ? file.id : null)}>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={`ml-2 p-1 rounded hover:bg-zinc-700/60 transition-opacity ${menuOpenId === file.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                            tabIndex={-1}
                            onClick={e => { e.stopPropagation(); setMenuOpenId(file.id) }}
                          >
                            <EllipsisVertical className="w-4 h-4 text-zinc-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                          <FileMenu
                            onOpen={onOpen}
                            onSendToChat={onSendToChat}
                            onCopyName={onCopyName}
                            onCopyPath={onCopyPath}
                            onDelete={onDelete}
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent onClick={e => e.stopPropagation()}>
                    <FileMenu
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