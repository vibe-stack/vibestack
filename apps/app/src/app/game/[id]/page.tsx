"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useGameEditorStore } from "@/store/game-editor-store";
import { fetchGame } from "@/actions/game-actions";
import EngineUI from "@/engine-ui";

export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;
  
  const { 
    setGame, 
    setLoading, 
    setError, 
    isLoading, 
    error 
  } = useGameEditorStore();

  // Fetch game data
  useEffect(() => {
    const loadGame = async () => {
      if (!gameId) return;
      
      try {
        setLoading(true);
        const gameData = await fetchGame(gameId);
        setGame(gameData);
        
        // Open the first file by default if any files exist
        if (gameData.files.length > 0) {
          // These will be handled in the editor component using the store
        }
      } catch (err: any) {
        setError(err.message);
      }
    };

    loadGame();
  }, [gameId, setGame, setLoading, setError]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Loading game editor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return <EngineUI />;
}
