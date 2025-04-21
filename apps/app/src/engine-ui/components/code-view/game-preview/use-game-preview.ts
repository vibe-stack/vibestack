import { useState, useRef, useEffect, useCallback } from "react"
import { bundleGameFiles, createGameIframeContent, stopEsbuild } from "@/lib/bundle-browser"
import { sendMessageToGame, toggleFullscreen } from "./game-preview-utils"
import { GameFile } from "@/store/game-editor-store"
import { useSceneHierarchyStore } from "@/store/scene-hierarchy-store"
import { extractSceneHierarchy } from "./extract-scene-hierarchy"

// Amount of time to wait before assuming the game is loaded if no LOADED event is received
const GAME_LOAD_TIMEOUT = 2000 // 2 seconds

export function useGamePreview(game?: { files: GameFile[] }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBundling, setIsBundling] = useState(false)
  const [bundleError, setBundleError] = useState<string | null>(null)
  const [gameLoaded, setGameLoaded] = useState(false)
  const [gameError, setGameError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null!)
  const { setSceneNodes } = useSceneHierarchyStore()
  const sceneUpdateInterval = useRef<NodeJS.Timeout | null>(null)
  const gameLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [previewKey, setPreviewKey] = useState(0)

  const hasGameFiles = game?.files && game.files.length > 0

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
            
            // Set a timeout to assume game is loaded if no LOADED message is received
            if (gameLoadTimeoutRef.current) {
              clearTimeout(gameLoadTimeoutRef.current)
            }
            
            gameLoadTimeoutRef.current = setTimeout(() => {
              if (!gameLoaded && isPlaying) {
                console.log("Game load timeout reached, assuming game is loaded")
                setGameLoaded(true)
                startSceneHierarchyPolling()
              }
            }, GAME_LOAD_TIMEOUT)
          }
        }
      } catch (error) {
        setBundleError(error instanceof Error ? error.message : 'Unknown error during bundling')
        setIsPlaying(false)
      } finally {
        setIsBundling(false)
      }
    }
    bundleAndRunGame()
    return () => {
      if (!isPlaying) stopEsbuild()
      if (sceneUpdateInterval.current) {
        clearInterval(sceneUpdateInterval.current)
        sceneUpdateInterval.current = null
      }
      if (gameLoadTimeoutRef.current) {
        clearTimeout(gameLoadTimeoutRef.current)
        gameLoadTimeoutRef.current = null
      }
    }
  }, [isPlaying, hasGameFiles, game?.files, game])

  // Function to poll the scene hierarchy from the iframe
  const updateSceneHierarchy = useCallback(() => {
    if (iframeRef.current && isPlaying) {
      const sceneNodes = extractSceneHierarchy(iframeRef.current)
      setSceneNodes(sceneNodes)
    }
  }, [isPlaying, setSceneNodes])

  // Function to poll the scene hierarchy from the iframe
  const startSceneHierarchyPolling = useCallback(() => {
    // First immediate update
    updateSceneHierarchy()
    
    // Then start polling
    if (sceneUpdateInterval.current) {
      clearInterval(sceneUpdateInterval.current)
    }
    
    sceneUpdateInterval.current = setInterval(() => {
      updateSceneHierarchy()
    }, 500) // Poll every 500ms
  }, [updateSceneHierarchy])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return
      const message = event.data
      if (message.type === 'LOADED') {
        if (gameLoadTimeoutRef.current) {
          clearTimeout(gameLoadTimeoutRef.current)
          gameLoadTimeoutRef.current = null
        }
        setGameLoaded(true)
        setGameError(null)
        
        // Start polling the scene hierarchy when game is loaded
        startSceneHierarchyPolling()
      } else if (message.type === 'ERROR') {
        setGameError(message.message)
      }
    }
    
    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [startSceneHierarchyPolling])

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
      
      // Clear the scene nodes when game is stopped
      setSceneNodes([])
      
      // Stop polling
      if (sceneUpdateInterval.current) {
        clearInterval(sceneUpdateInterval.current)
        sceneUpdateInterval.current = null
      }
      
      // Clear any pending game load timeout
      if (gameLoadTimeoutRef.current) {
        clearTimeout(gameLoadTimeoutRef.current)
        gameLoadTimeoutRef.current = null
      }
    }
  }, [isPlaying, setSceneNodes])

  const togglePlay = () => {
    if (isBundling) return
    setIsPlaying((prev) => {
      const next = !prev
      setPreviewKey((k) => k + 1)
      return next
    })
  }

  const resetGame = () => {
    if (isBundling) return
    setIsPlaying(false)
    setBundleError(null)
    setGameError(null)
    setTimeout(() => {
      setPreviewKey((k) => k + 1)
      setIsPlaying(true)
    }, 100)
  }

  const handleFullscreen = () => {
    toggleFullscreen(iframeRef)
    sendMessageToGame(iframeRef, { type: 'FULLSCREEN', value: true })
  }

  return {
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
    setGameError,
    previewKey
  }
} 