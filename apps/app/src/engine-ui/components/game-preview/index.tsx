"use client"

import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Maximize2, Loader2 } from "lucide-react"
import { useGameEditorStore } from "@/store/game-editor-store"
import EmptyState from "./empty-state"
import ErrorDisplay from "./error-display"
import { useGamePreview } from "./use-game-preview"

interface GamePreviewProps {
  onExpandChat?: () => void
}

export default function GamePreview({ onExpandChat }: GamePreviewProps) {
  const { game } = useGameEditorStore()
  const {
    isPlaying,
    isBundling,
    bundleError,
    gameLoaded,
    gameError,
    iframeRef,
    togglePlay,
    resetGame,
    handleFullscreen,
    setBundleError,
    setGameError
  } = useGamePreview(game ?? undefined)

  const hasGameFiles = game?.files && game.files.length > 0

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
                disabled={isBundling}
                className="h-8 w-8 rounded-full bg-zinc-800/50 hover:bg-zinc-800"
              >
                {isBundling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={resetGame}
                disabled={isBundling || !isPlaying}
                className="h-8 w-8 rounded-full bg-zinc-800/50 hover:bg-zinc-800"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              {isPlaying && !isBundling && (
                <div className={`rounded-full h-2 w-2 ${gameLoaded ? 'bg-green-500' : gameError ? 'bg-red-500' : 'bg-yellow-500'}`} />
              )}
            </div>
            <div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-zinc-800/50 hover:bg-zinc-800"
                onClick={handleFullscreen}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 relative overflow-hidden w-full">
            <iframe 
              ref={iframeRef}
              className="absolute inset-0 w-full h-full border-0 bg-black"
              title="Game Preview"
              sandbox="allow-scripts allow-same-origin"
            />
            {bundleError && (
              <ErrorDisplay 
                error={bundleError} 
                type="bundle" 
                setBundleError={setBundleError}
                setGameError={setGameError}
                resetGame={resetGame}
              />
            )}
            {gameError && isPlaying && !bundleError && (
              <ErrorDisplay 
                error={gameError} 
                type="runtime" 
                setBundleError={setBundleError}
                setGameError={setGameError}
                resetGame={resetGame}
              />
            )}
          </div>
        </>
      ) : (
        <EmptyState onExpandChat={onExpandChat} />
      )}
    </div>
  )
}