"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Maximize2, MessageSquare } from "lucide-react"
import { useGameEditorStore, type Game } from "@/store/game-editor-store"
import { Mesh, BoxGeometry, MeshBasicMaterial, PerspectiveCamera, Scene } from "three"

interface GamePreviewProps {
  onExpandChat?: () => void;
}

export default function GamePreview({ onExpandChat }: GamePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { game, sceneRef, setSceneRef, removeSceneRef } = useGameEditorStore()
  
  // Check if there are any game files
  const hasGameFiles = game?.files && game.files.length > 0
  
  // Simple animation loop for demonstration
  useEffect(() => {
    if (!sceneRef) return
    if (!hasGameFiles) return

    const gameInstance = new GameInstance(game)
    setSceneRef(gameInstance.getScene())

    return () => {
      removeSceneRef()
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

class GameInstance {
  scene: Scene;
  camera: PerspectiveCamera;
  cube: Mesh;
  game: Game;

  constructor(game: Game) {
    this.game = game;
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 5;
    this.scene.add(this.camera);

    const box = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    this.cube = new Mesh(box, material);
    this.scene.add(this.cube);
  }

  update(deltaTime: number) {
    // Update game logic here
    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;
  }

  getScene() {
    return this.scene;
  }

  destroy() {
  }
}
