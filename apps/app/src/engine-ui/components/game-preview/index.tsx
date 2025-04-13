"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Maximize2, MessageSquare, Loader2 } from "lucide-react"
import { useGameEditorStore } from "@/store/game-editor-store"
import { bundleGameFiles, createGameIframeContent, stopEsbuild } from "@/lib/bundle-browser"

interface GamePreviewProps {
  onExpandChat?: () => void;
}

export default function GamePreview({ onExpandChat }: GamePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBundling, setIsBundling] = useState(false)
  const [bundleError, setBundleError] = useState<string | null>(null)
  const [gameLoaded, setGameLoaded] = useState(false)
  const [gameError, setGameError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { game } = useGameEditorStore()
  
  // Check if there are any game files
  const hasGameFiles = game?.files && game.files.length > 0
  
  // Handle game bundling and loading
  useEffect(() => {
    if (!hasGameFiles || !isPlaying) return
    
    const bundleAndRunGame = async () => {
      try {
        setIsBundling(true)
        setBundleError(null)
        setGameError(null)
        setGameLoaded(false)
        
        const bundledCode = await bundleGameFiles(game!.files)
        const iframeContent = createGameIframeContent(bundledCode)
        
        if (iframeRef.current) {
          const iframe = iframeRef.current
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
          
          if (iframeDoc) {
            iframeDoc.open()
            iframeDoc.write(iframeContent)
            iframeDoc.close()
            
            // Don't set game as loaded here - wait for the LOADED message from iframe
          }
        }
      } catch (error) {
        console.error("Failed to bundle game:", error)
        setBundleError(error instanceof Error ? error.message : 'Unknown error during bundling')
        setIsPlaying(false)
      } finally {
        setIsBundling(false)
      }
    }
    
    bundleAndRunGame()
    
    // Cleanup when unmounting
    return () => {
      // Stop esbuild when component unmounts to free memory
      if (!isPlaying) {
        stopEsbuild();
      }
    }
  }, [isPlaying, hasGameFiles, game?.files])
  
  // Setup iframe message communication
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
      
      const message = event.data;
      
      if (message.type === 'LOADED') {
        console.log('Game loaded successfully');
        setGameLoaded(true);
        setGameError(null);
      } else if (message.type === 'ERROR') {
        console.error('Game error:', message);
        setGameError(message.message);
        // Don't stop the game on error - just show the error
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  // Cleanup iframe when component unmounts or when stopped
  useEffect(() => {
    if (!isPlaying && iframeRef.current) {
      const iframe = iframeRef.current
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      
      if (iframeDoc) {
        iframeDoc.open()
        iframeDoc.write('')
        iframeDoc.close()
      }
      
      setGameLoaded(false)
      setGameError(null)
    }
  }, [isPlaying])
  
  // Send messages to iframe
  const sendMessageToGame = (message: any) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(message, '*');
    }
  };

  const togglePlay = () => {
    if (isBundling) return
    
    if (isPlaying) {
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
    }
  }
  
  const resetGame = () => {
    if (isBundling) return
    
    setIsPlaying(false)
    setBundleError(null)
    setGameError(null)
    
    // Short delay before restarting
    setTimeout(() => setIsPlaying(true), 100)
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
  
  // Error display component
  const ErrorDisplay = ({ error, type }: { error: string, type: 'bundle' | 'runtime' }) => (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-10">
      <div className={`${type === 'bundle' ? 'bg-red-950/50 border-red-700' : 'bg-orange-950/50 border-orange-700'} border p-6 rounded-lg max-w-lg w-full`}>
        <h3 className={`${type === 'bundle' ? 'text-red-400' : 'text-orange-400'} font-medium mb-2`}>
          {type === 'bundle' ? 'Bundle Error' : 'Runtime Error'}
        </h3>
        <div className="bg-black/50 p-3 rounded text-red-300 font-mono text-sm mb-3 overflow-auto max-h-40">
          {error}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            className="flex-1"
            onClick={() => type === 'bundle' ? setBundleError(null) : setGameError(null)}
          >
            Dismiss
          </Button>
          {type === 'runtime' && (
            <Button 
              variant="default"
              className="flex-1" 
              onClick={resetGame}
            >
              Restart Game
            </Button>
          )}
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
              
              {/* Game status indicator */}
              {isPlaying && !isBundling && (
                <div className={`rounded-full h-2 w-2 ${gameLoaded ? 'bg-green-500' : gameError ? 'bg-red-500' : 'bg-yellow-500'}`} />
              )}
            </div>
            <div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-zinc-800/50 hover:bg-zinc-800"
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
            {bundleError && <ErrorDisplay error={bundleError} type="bundle" />}
            {gameError && isPlaying && !bundleError && <ErrorDisplay error={gameError} type="runtime" />}
          </div>
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  )
}
