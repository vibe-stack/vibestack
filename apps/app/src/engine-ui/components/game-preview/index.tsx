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
          <div className="flex items-center justify-between px-2 py-1 bg-zinc-900/60 backdrop-blur-md rounded-t-xl border-b border-green-900/10 shadow-[0_2px_8px_0_rgba(166,227,161,0.04)]">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                disabled={isBundling}
                className="h-7 w-7 rounded-full bg-zinc-800/40 hover:bg-green-900/20 border border-green-900/10 shadow-none"
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
                className="h-7 w-7 rounded-full bg-zinc-800/40 hover:bg-green-900/20 border border-green-900/10 shadow-none"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              {isPlaying && !isBundling && (
                <div className={`rounded-full h-2 w-2 shadow-[0_0_6px_1px_rgba(166,227,161,0.18)] transition-colors duration-200 ${gameLoaded ? 'bg-green-400/80' : gameError ? 'bg-red-400/80' : 'bg-yellow-400/80'}`} />
              )}
            </div>
            <div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded-full bg-zinc-800/40 hover:bg-green-900/20 border border-green-900/10 shadow-none"
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