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
        
        // Set the game data - even if there are no files yet
        setGame(gameData);
      } catch (err: any) {
        console.error("Error loading game:", err);
        setError(err.message || "Failed to load game");
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

  // The EngineUI component will handle empty state when there are no files
  return <EngineUI />;
}
