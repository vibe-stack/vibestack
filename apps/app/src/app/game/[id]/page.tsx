"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useGameEditorStore } from "@/store/game-editor-store";
import { fetchGame } from "@/actions/game-actions";
import EngineUI from "@/engine-ui";
import EtherealLoading from "@/components/ui/ethereal-loading"

export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;

  const { setGame, setLoading, setError, isLoading, error } =
    useGameEditorStore();

  const [minLoading, setMinLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setMinLoading(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  // Fetch game data
  useEffect(() => {
    const loadGame = async () => {
      if (!gameId) return;

      try {
        setLoading(true);
        const gameData = await fetchGame(gameId);

        // Set the game data - even if there are no files yet
        setGame(gameData);
      } catch (err) {
        console.error("Error loading game:", err);
        setError(err instanceof Error ? err.message : "Failed to load game");
      }
    };

    loadGame();
  }, [gameId, setGame, setLoading, setError]);

  if (isLoading || minLoading) {
    return <EtherealLoading />
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
