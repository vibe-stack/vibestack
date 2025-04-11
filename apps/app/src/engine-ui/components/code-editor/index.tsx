"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, X, Save } from "lucide-react"

export default function CodeEditor() {
  const [files, setFiles] = useState([
    {
      id: 1,
      name: "game.js",
      content:
        "// Game logic goes here\n\nfunction update() {\n  // Update game state\n}\n\nfunction render() {\n  // Render game objects\n}\n",
    },
    {
      id: 2,
      name: "player.js",
      content:
        "// Player class\n\nclass Player {\n  constructor(x, y) {\n    this.x = x;\n    this.y = y;\n    this.speed = 5;\n  }\n\n  move(dx, dy) {\n    this.x += dx * this.speed;\n    this.y += dy * this.speed;\n  }\n\n  render(ctx) {\n    ctx.fillStyle = '#8b5cf6';\n    \n    // Draw a rounded rectangle\n    const radius = 8;\n    ctx.beginPath();\n    ctx.moveTo(this.x + radius, this.y);\n    ctx.lineTo(this.x + 50 - radius, this.y);\n    ctx.arcTo(this.x + 50, this.y, this.x + 50, this.y + radius, radius);\n    ctx.lineTo(this.x + 50, this.y + 50 - radius);\n    ctx.arcTo(this.x + 50, this.y + 50, this.x + 50 - radius, this.y + 50, radius);\n    ctx.lineTo(this.x + radius, this.y + 50);\n    ctx.arcTo(this.x, this.y + 50, this.x, this.y + 50 - radius, radius);\n    ctx.lineTo(this.x, this.y + radius);\n    ctx.arcTo(this.x, this.y, this.x + radius, this.y, radius);\n    ctx.fill();\n  }\n}",
    },
    {
      id: 3,
      name: "enemy.js",
      content:
        "// Enemy class\n\nclass Enemy {\n  constructor(x, y) {\n    this.x = x;\n    this.y = y;\n    this.speed = 2;\n  }\n\n  update(playerX, playerY) {\n    // Move towards player\n    const dx = playerX - this.x;\n    const dy = playerY - this.y;\n    const dist = Math.sqrt(dx * dx + dy * dy);\n    \n    if (dist > 0) {\n      this.x += (dx / dist) * this.speed;\n      this.y += (dy / dist) * this.speed;\n    }\n  }\n\n  render(ctx) {\n    ctx.fillStyle = '#ec4899';\n    \n    // Draw a rounded rectangle\n    const radius = 6;\n    ctx.beginPath();\n    ctx.moveTo(this.x + radius, this.y);\n    ctx.lineTo(this.x + 40 - radius, this.y);\n    ctx.arcTo(this.x + 40, this.y, this.x + 40, this.y + radius, radius);\n    ctx.lineTo(this.x + 40, this.y + 40 - radius);\n    ctx.arcTo(this.x + 40, this.y + 40, this.x + 40 - radius, this.y + 40, radius);\n    ctx.lineTo(this.x + radius, this.y + 40);\n    ctx.arcTo(this.x, this.y + 40, this.x, this.y + 40 - radius, radius);\n    ctx.lineTo(this.x, this.y + radius);\n    ctx.arcTo(this.x, this.y, this.x + radius, this.y, radius);\n    ctx.fill();\n  }\n}",
    },
  ])
  const [activeFile, setActiveFile] = useState(files[0].id)

  const addNewFile = () => {
    const newId = Math.max(...files.map((f) => f.id)) + 1
    const newFile = { id: newId, name: `file${newId}.js`, content: "// New file" }
    setFiles([...files, newFile])
    setActiveFile(newId)
  }

  const closeFile = (id: number) => {
    if (files.length <= 1) return
    const newFiles = files.filter((f) => f.id !== id)
    setFiles(newFiles)
    if (activeFile === id) {
      setActiveFile(newFiles[0].id)
    }
  }

  const updateFileContent = (id: number, content: string) => {
    setFiles(files.map((f) => (f.id === id ? { ...f, content } : f)))
  }

  const getActiveFileContent = () => {
    return files.find((f) => f.id === activeFile)?.content || ""
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center overflow-x-auto py-2 px-3 gap-1">
        {files.map((file) => (
          <div
            key={file.id}
            className={`flex items-center px-3 py-1.5 min-w-[120px] rounded-lg transition-colors ${
              activeFile === file.id ? "bg-zinc-800/70" : "hover:bg-zinc-800/40"
            }`}
            onClick={() => setActiveFile(file.id)}
          >
            <span className="text-sm truncate flex-1">{file.name}</span>
            {files.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-1 opacity-50 hover:opacity-100 rounded-full"
                onClick={(e) => {
                  e.stopPropagation()
                  closeFile(file.id)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 rounded-full" onClick={addNewFile}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden w-full">
        <div className="h-full w-full flex flex-col">
          <div className="flex-1 p-4 font-mono text-sm bg-zinc-950/50 overflow-auto rounded-lg mx-3">
            <pre className="whitespace-pre-wrap">{getActiveFileContent()}</pre>
          </div>

          <div className="p-3 flex justify-between items-center">
            <div className="text-xs text-zinc-400">{files.find((f) => f.id === activeFile)?.name}</div>
            <Button size="sm" className="h-8 rounded-lg bg-violet-700 hover:bg-violet-600">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
