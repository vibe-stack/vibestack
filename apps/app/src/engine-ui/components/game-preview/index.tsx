"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Maximize2, MessageSquare, Loader2 } from "lucide-react"
import { useGameEditorStore } from "@/store/game-editor-store"
import { bundleGameFiles, stopEsbuild, initEsbuild } from "@/lib/bundle-browser"

interface GamePreviewProps {
  onExpandChat?: () => void;
}

// Game message types for type-safety
type GameEventData = {
  clientX?: number;
  clientY?: number;
  button?: number;
  buttons?: number;
  offsetX?: number;
  offsetY?: number;
  key?: string;
  code?: string;
  keyCode?: number;
  altKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  [key: string]: string | number | boolean | undefined;
};

type GameMessage = 
  | { type: 'INIT'; canvas: OffscreenCanvas }
  | { type: 'EVENT'; eventType: string; eventData: GameEventData }
  | { type: 'RESTART' }
  | { type: 'PLAY' }
  | { type: 'PAUSE' };

export default function GamePreview({ onExpandChat }: GamePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBundling, setIsBundling] = useState(false)
  const [bundleError, setBundleError] = useState<string | null>(null)
  const [gameLoaded, setGameLoaded] = useState(false)
  const [gameError, setGameError] = useState<string | null>(null)
  const [worker, setWorker] = useState<Worker | null>(null)
  const [bundledCode, setBundledCode] = useState<string | null>(null)
  const workerInitialized = useRef(false)
  
  // Use a container ref instead of a direct canvas ref
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  
  const { game } = useGameEditorStore()
  
  // Check if there are any game files
  const hasGameFiles = game?.files && game.files.length > 0
  
  // Preload esbuild when component mounts
  useEffect(() => {
    // Initialize esbuild early to avoid delays later
    const preloadEsbuild = async () => {
      try {
        console.log("Preloading esbuild WASM...")
        await initEsbuild()
        console.log("esbuild WASM preloaded successfully")
      } catch (error) {
        console.error("Failed to preload esbuild:", error)
      }
    }
    
    preloadEsbuild()
    
    // Cleanup esbuild when component unmounts
    return () => {
      stopEsbuild()
    }
  }, [])
  
  // Handle game bundling separately from worker creation
  useEffect(() => {
    if (!hasGameFiles || !isPlaying) return
    
    // Log game files for debugging
    console.log("Game files to process:", game?.files.map(f => ({
      path: f.path,
      contentLength: f.content.length,
      contentStart: f.content.substring(0, 50) + '...'
    })));
    
    const bundleGame = async () => {
      if (bundledCode) return // Skip if we already have bundled code
      
      try {
        setIsBundling(true)
        setBundleError(null)
        setGameError(null)
        setGameLoaded(false)
        
        console.log("Starting game bundling process...")
        const newBundledCode = await bundleGameFiles(game!.files)
        console.log("Game bundle created successfully, size:", newBundledCode.length)
        console.log("Bundle sample:", newBundledCode.substring(0, 200) + "...")
        setBundledCode(newBundledCode)
      } catch (error) {
        console.error("Failed to bundle game:", error)
        setBundleError(error instanceof Error ? error.message : 'Unknown error during bundling')
        setIsPlaying(false)
      } finally {
        setIsBundling(false)
      }
    }
    
    bundleGame()
  }, [hasGameFiles, isPlaying, game?.files, bundledCode])
  
  // Handle worker creation separately from bundling
  useEffect(() => {
    if (!bundledCode || !isPlaying || !canvasContainerRef.current || workerInitialized.current) return
    
    console.log("Creating worker with bundled code:", bundledCode.substring(0, 100) + "...")
    
    const createWorker = () => {
      try {
        // Create a new canvas element
        const container = canvasContainerRef.current;
        if (!container) return;
        
        console.log("Setting up canvas container:", container);
        container.innerHTML = ''; // Clear previous canvas
        
        const canvas = document.createElement('canvas');
        canvas.className = 'absolute inset-0 w-full h-full bg-black';
        canvas.id = 'game-canvas-' + Date.now(); // Unique ID
        container.appendChild(canvas);
        console.log("Canvas created and appended to container:", canvas.id);
        
        // Create worker code with bundled game code
        const workerCode = `
          // Use ESM imports for external libraries
          import * as THREE from 'https://unpkg.com/three@0.175.0/build/three.module.js';
          import nipplejs from 'https://unpkg.com/nipplejs@0.10.1/dist/nipplejs.min.js';
          import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';
          
          // Set up globals for compatibility
          self.window = self; // Make the window object available
          self.THREE = THREE;
          self.nipplejs = nipplejs;
          self.CANNON = CANNON;

          // Set up DOM-like environment
          self.document = {
            getElementById: function(id) {
              if (id === 'GGEZ_CANVAS') {
                return self.offscreenCanvas;
              }
              return null;
            }
          };

          // Mock GGEZ div
          self.GGEZ = {
            appendChild: function() {}
          };

          // Mock window for event handling
          self.eventListeners = {};
          self.addEventListener = function(type, listener) {
            if (!self.eventListeners[type]) self.eventListeners[type] = [];
            self.eventListeners[type].push(listener);
          };
          
          // Error handling
          self.onerror = function(message, source, lineno, colno, error) {
            self.postMessage({
              type: 'ERROR',
              message: message,
              stack: error?.stack || ''
            });
            return true;
          };

          // Handle messages from main thread
          self.onmessage = function(event) {
            if (event.data.type === 'INIT') {
              self.offscreenCanvas = event.data.canvas;
              console.log('Worker received canvas:', !!self.offscreenCanvas);
              
              // Log canvas properties
              if (self.offscreenCanvas) {
                console.log('Canvas properties:', {
                  width: self.offscreenCanvas.width,
                  height: self.offscreenCanvas.height,
                  constructor: self.offscreenCanvas.constructor.name
                });
                
                // Check if offscreenCanvas is correctly accessible
                try {
                  if (self.offscreenCanvas.getContext) {
                    const ctx = self.offscreenCanvas.getContext('2d');
                    console.log('2D context available:', !!ctx);
                    
                    // Try to draw something basic to verify canvas works
                    if (ctx) {
                      ctx.fillStyle = 'red';
                      ctx.fillRect(0, 0, 100, 100);
                      console.log('Drew red rectangle on canvas');
                    }
                    
                    // Try WebGL context too
                    const gl = self.offscreenCanvas.getContext('webgl') || 
                               self.offscreenCanvas.getContext('experimental-webgl');
                    console.log('WebGL context available:', !!gl);
                  } else {
                    console.error('Canvas getContext method not available');
                  }
                } catch (e) {
                  console.error('Error accessing canvas methods:', e);
                }
              }
              
              try {
                ${bundledCode}
                self.postMessage({ type: 'LOADED' });
                console.log('Worker executed game code successfully');
              } catch (err) {
                console.error('Worker failed to execute game code:', err);
                self.postMessage({ 
                  type: 'ERROR',
                  message: err.message,
                  stack: err.stack || ''
                });
              }
            } else if (event.data.type === 'EVENT') {
              const { eventType, eventData } = event.data;
              if (self.eventListeners[eventType]) {
                self.eventListeners[eventType].forEach(listener => {
                  try {
                    listener(eventData);
                  } catch (err) {
                    self.postMessage({
                      type: 'ERROR',
                      message: err.message,
                      stack: err.stack || ''
                    });
                  }
                });
              }
            } else if (event.data.type === 'RESTART') {
              // The game can handle restart messages
              if (typeof self.restartGame === 'function') {
                try {
                  self.restartGame();
                  self.postMessage({ type: 'RESTARTED' });
                } catch (err) {
                  self.postMessage({
                    type: 'ERROR',
                    message: 'Failed to restart game: ' + err.message,
                    stack: err.stack || ''
                  });
                }
              }
            } else if (event.data.type === 'PLAY') {
              if (typeof self.playGame === 'function') {
                try {
                  self.playGame();
                } catch (err) {
                  self.postMessage({
                    type: 'ERROR',
                    message: 'Failed to play game: ' + err.message,
                    stack: err.stack || ''
                  });
                }
              }
            } else if (event.data.type === 'PAUSE') {
              if (typeof self.pauseGame === 'function') {
                try {
                  self.pauseGame();
                } catch (err) {
                  self.postMessage({
                    type: 'ERROR',
                    message: 'Failed to pause game: ' + err.message,
                    stack: err.stack || ''
                  });
                }
              }
            }
          };
        `;
        
        // Create worker from blob with type: 'module' to support ESM imports
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const gameWorker = new Worker(workerUrl, { type: 'module' });
        console.log("Worker created from blob URL");
        
        // Set up worker communication
        gameWorker.onmessage = (event) => {
          const message = event.data;
          console.log("Message received from worker:", message.type);
          
          if (message.type === 'LOADED') {
            console.log('Game loaded successfully in worker');
            setGameLoaded(true);
            setGameError(null);
          } else if (message.type === 'ERROR') {
            console.error('Game error in worker:', message);
            setGameError(message.message);
          } else if (message.type === 'RESTARTED') {
            console.log('Game restarted successfully');
          }
        };
        
        // Transfer canvas control to worker - this is only called once per canvas instance
        const offscreen = canvas.transferControlToOffscreen();
        console.log("Transferring canvas control to worker");
        gameWorker.postMessage({ type: 'INIT', canvas: offscreen }, [offscreen]);
        
        // Store worker reference for cleanup
        setWorker(gameWorker);
        workerInitialized.current = true;
        
        // Clean up blob URL
        URL.revokeObjectURL(workerUrl);
      } catch (error) {
        console.error("Failed to create worker:", error)
        setGameError(error instanceof Error ? error.message : 'Unknown error creating game worker')
        setIsPlaying(false)
      }
    }
    
    createWorker()
  }, [bundledCode, isPlaying])
  
  // Set up event forwarding to worker
  useEffect(() => {
    if (!worker || !isPlaying || !canvasContainerRef.current) return;
    
    // Get the current canvas from the container
    const canvas = canvasContainerRef.current.querySelector('canvas');
    if (!canvas) return;
    
    // Forward mouse events
    const mouseEvents = ['mousedown', 'mouseup', 'mousemove', 'click'] as const;
    const mouseListeners = mouseEvents.map(eventType => {
      const listener = (e: MouseEvent) => {
        worker.postMessage({
          type: 'EVENT',
          eventType,
          eventData: {
            clientX: e.clientX,
            clientY: e.clientY,
            button: e.button,
            buttons: e.buttons,
            offsetX: e.offsetX,
            offsetY: e.offsetY
          }
        } as GameMessage);
      };
      
      canvas.addEventListener(eventType, listener);
      return { eventType, listener };
    });
    
    // Forward keyboard events
    const keyEvents = ['keydown', 'keyup'] as const;
    const keyListeners = keyEvents.map(eventType => {
      const listener = (e: KeyboardEvent) => {
        worker.postMessage({
          type: 'EVENT',
          eventType,
          eventData: {
            key: e.key,
            code: e.code,
            keyCode: e.keyCode,
            altKey: e.altKey,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey
          }
        } as GameMessage);
      };
      
      window.addEventListener(eventType, listener);
      return { eventType, listener, target: window };
    });
    
    // Cleanup event listeners
    return () => {
      mouseListeners.forEach(({ eventType, listener }) => {
        canvas.removeEventListener(eventType, listener as EventListener);
      });
      
      keyListeners.forEach(({ eventType, listener, target }) => {
        target.removeEventListener(eventType, listener as EventListener);
      });
    };
  }, [worker, isPlaying]);
  
  // Cleanup when component unmounts or when stopped
  useEffect(() => {
    if (!isPlaying && worker) {
      worker.terminate();
      setWorker(null);
      workerInitialized.current = false;
      setGameLoaded(false);
      setGameError(null);
      
      // Clear the canvas container
      if (canvasContainerRef.current) {
        canvasContainerRef.current.innerHTML = '';
      }
    }
  }, [isPlaying, worker])
  
  // Reset bundled code when game files change
  useEffect(() => {
    if (game?.files) {
      // Clear bundled code when files change to force rebundling
      setBundledCode(null);
    }
  }, [game?.files]);
  
  // Send messages to game worker
  const sendMessageToGame = (message: GameMessage) => {
    if (worker) {
      worker.postMessage(message);
    }
  };

  const togglePlay = () => {
    if (isBundling) return
    
    if (isPlaying) {
      setIsPlaying(false)
      if (worker) {
        sendMessageToGame({ type: 'PAUSE' });
      }
    } else {
      setIsPlaying(true)
      if (worker) {
        sendMessageToGame({ type: 'PLAY' });
      }
    }
  }
  
  const resetGame = () => {
    if (isBundling) return
    
    if (isPlaying && worker) {
      // Try to restart the game within the worker first
      sendMessageToGame({ type: 'RESTART' });
    } else {
      // If not playing, start a new game instance
      setIsPlaying(false)
      setBundleError(null)
      setGameError(null)
      setBundledCode(null)
      workerInitialized.current = false;
      
      // Short delay before restarting
      setTimeout(() => setIsPlaying(true), 100)
    }
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
            <div 
              ref={canvasContainerRef}
              className="absolute inset-0 w-full h-full bg-black"
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
