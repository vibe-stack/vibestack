"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Game {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function HomePage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [newGameDescription, setNewGameDescription] = useState("");

  // Fetch games
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/games");
        
        if (!res.ok) {
          throw new Error("Failed to fetch games");
        }
        
        const gamesData = await res.json();
        setGames(gamesData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  // Create a new game
  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGameName.trim()) {
      return;
    }
    
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newGameName,
          description: newGameDescription || undefined,
        }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to create game");
      }
      
      const newGame = await res.json();
      
      // Redirect to the game editor
      router.push(`/game/${newGame.id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Game Projects</h1>
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create New Game
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Game creation form */}
      {creating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Game</h2>
            
            <form onSubmit={handleCreateGame}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="name">
                  Game Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1" htmlFor="description">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={newGameDescription}
                  onChange={(e) => setNewGameDescription(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Game list */}
      {loading ? (
        <div className="text-center py-8">Loading games...</div>
      ) : games.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No games yet. Create your first game to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Link
              href={`/game/${game.id}`}
              key={game.id}
              className="block border rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
            >
              <h2 className="text-xl font-semibold mb-2">{game.name}</h2>
              {game.description && (
                <p className="text-gray-600 mb-4 line-clamp-2">{game.description}</p>
              )}
              <div className="text-sm text-gray-500">
                <p>Created: {formatDate(game.createdAt)}</p>
                <p>Last updated: {formatDate(game.updatedAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
