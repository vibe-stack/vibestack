import { useState, useRef, useEffect } from "react"
import { bundleGameFiles, createGameIframeContent, stopEsbuild } from "@/lib/bundle-browser"
import { sendMessageToGame, toggleFullscreen } from "./game-preview-utils"
import { GameFile } from "@/store/game-editor-store"
import { useSceneHierarchyStore } from "@/store/scene-hierarchy-store"
import { extractSceneHierarchy } from "./extract-scene-hierarchy"

export function useGamePreview(game?: { files: GameFile[] }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBundling, setIsBundling] = useState(false)
  const [bundleError, setBundleError] = useState<string | null>(null)
  const [gameLoaded, setGameLoaded] = useState(false)
  const [gameError, setGameError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null!)
  const { setSceneNodes } = useSceneHierarchyStore()
  const sceneUpdateInterval = useRef<NodeJS.Timeout | null>(null)

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
    }
  }, [isPlaying, hasGameFiles, game?.files])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return
      const message = event.data
      if (message.type === 'LOADED') {
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
  }, [])

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
    }
  }, [isPlaying, setSceneNodes])

  // Function to poll the scene hierarchy from the iframe
  const startSceneHierarchyPolling = () => {
    // First immediate update
    updateSceneHierarchy()
    
    // Then start polling
    if (sceneUpdateInterval.current) {
      clearInterval(sceneUpdateInterval.current)
    }
    
    sceneUpdateInterval.current = setInterval(() => {
      updateSceneHierarchy()
    }, 500) // Poll every 500ms
  }
  
  const updateSceneHierarchy = () => {
    if (iframeRef.current && gameLoaded && isPlaying) {
      const sceneNodes = extractSceneHierarchy(iframeRef.current)
      setSceneNodes(sceneNodes)
    }
  }

  const togglePlay = () => {
    if (isBundling) return
    setIsPlaying((prev) => !prev)
  }

  const resetGame = () => {
    if (isBundling) return
    setIsPlaying(false)
    setBundleError(null)
    setGameError(null)
    setTimeout(() => setIsPlaying(true), 100)
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
    setGameError
  }
} 