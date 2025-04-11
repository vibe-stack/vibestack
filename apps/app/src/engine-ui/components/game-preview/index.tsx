"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Maximize2, MessageSquare } from "lucide-react"
import { useGameEditorStore } from "@/store/game-editor-store"

interface GamePreviewProps {
  onExpandChat?: () => void;
}

export default function GamePreview({ onExpandChat }: GamePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { game } = useGameEditorStore()
  
  // Check if there are any game files
  const hasGameFiles = game?.files && game.files.length > 0
  
  // Simple animation loop for demonstration
  useEffect(() => {
    if (!canvasRef.current || !hasGameFiles) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let boxX = 50
    let boxY = 50
    let dirX = 1
    let dirY = 1

    const render = () => {
      if (!ctx) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Only update position if playing
      if (isPlaying) {
        boxX += dirX
        boxY += dirY

        // Bounce off walls
        if (boxX <= 0 || boxX >= canvas.width - 50) dirX *= -1
        if (boxY <= 0 || boxY >= canvas.height - 50) dirY *= -1
      }

      // Draw a simple box with rounded corners
      ctx.fillStyle = "#34D399" // Emerald color
      ctx.beginPath()
      const radius = 8
      ctx.moveTo(boxX + radius, boxY)
      ctx.lineTo(boxX + 50 - radius, boxY)
      ctx.arcTo(boxX + 50, boxY, boxX + 50, boxY + radius, radius)
      ctx.lineTo(boxX + 50, boxY + 50 - radius)
      ctx.arcTo(boxX + 50, boxY + 50, boxX + 50 - radius, boxY + 50, radius)
      ctx.lineTo(boxX + radius, boxY + 50)
      ctx.arcTo(boxX, boxY + 50, boxX, boxY + 50 - radius, radius)
      ctx.lineTo(boxX, boxY + radius)
      ctx.arcTo(boxX, boxY, boxX + radius, boxY, radius)
      ctx.fill()

      // Draw grid for reference (more subtle)
      ctx.strokeStyle = "rgba(63, 63, 70, 0.3)" // More transparent grid lines
      ctx.lineWidth = 0.5

      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      animationFrameId = window.requestAnimationFrame(render)
    }

    render()

    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [isPlaying, hasGameFiles])

  // Resize canvas to fit container
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return
      const container = canvasRef.current.parentElement
      if (!container) return

      canvasRef.current.width = container.clientWidth
      canvasRef.current.height = container.clientHeight
    }

    window.addEventListener("resize", handleResize)
    // Initial size
    setTimeout(handleResize, 0)

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const togglePlay = () => setIsPlaying(!isPlaying)
  const resetGame = () => {
    setIsPlaying(false)
    // Reset game state would go here
  }
  
  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="bg-zinc-800/50 p-8 rounded-xl max-w-md">
        <h3 className="text-xl font-medium mb-3">No Game Files Yet</h3>
        <p className="text-zinc-400 mb-6">
          Your game workspace is empty. Use the AI assistant to generate your first game file and start building.
        </p>
        <div className="flex justify-center">
          <Button 
            className="bg-emerald-700 hover:bg-emerald-600 gap-2"
            onClick={onExpandChat}
          >
            <MessageSquare className="h-4 w-4" />
            Start with AI Chat
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="relative flex flex-col h-full w-full">
      {hasGameFiles ? (
        <>
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="h-8 w-8 rounded-full bg-zinc-800/50 hover:bg-zinc-800"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={resetGame}
                className="h-8 w-8 rounded-full bg-zinc-800/50 hover:bg-zinc-800"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-zinc-800/50 hover:bg-zinc-800">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 relative overflow-hidden w-full">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          </div>
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  )
}
