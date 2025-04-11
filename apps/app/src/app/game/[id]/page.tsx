"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GameEditor } from "@/components/GameEditor";

interface Game {
  id: string;
  name: string;
  description?: string;
}

interface GameFile {
  id: string;
  path: string;
  type: string;
  content: string;
}

export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;
  
  const [game, setGame] = useState<Game | null>(null);
  const [files, setFiles] = useState<GameFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch game data
  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/games/${gameId}`);
        
        if (!res.ok) {
          throw new Error("Failed to fetch game");
        }
        
        const gameData = await res.json();
        setGame(gameData);
        
        // Fetch files for this game
        const filesRes = await fetch(`/api/games/${gameId}/files`);
        
        if (!filesRes.ok) {
          throw new Error("Failed to fetch files");
        }
        
        const filesData = await filesRes.json();
        
        // For each file, fetch its content
        const filesWithContent = await Promise.all(
          filesData.map(async (file: any) => {
            const contentRes = await fetch(`/api/files/${file.id}`);
            if (contentRes.ok) {
              const contentData = await contentRes.json();
              return {
                ...file,
                content: contentData.content || "",
              };
            }
            return {
              ...file,
              content: "",
            };
          })
        );
        
        setFiles(filesWithContent);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      fetchGame();
    }
  }, [gameId]);

  // Handle file save
  const handleSaveFile = async (fileId: string, content: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          commitMessage: "Update file",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save file");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle file creation
  const handleCreateFile = async (path: string, type: string, content: string) => {
    try {
      const res = await fetch(`/api/games/${gameId}/files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path,
          type,
          content,
          commitMessage: "Create file",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create file");
      }

      // Refresh files after creation
      const filesRes = await fetch(`/api/games/${gameId}/files`);
      if (filesRes.ok) {
        const filesData = await filesRes.json();
        
        // For each file, fetch its content
        const filesWithContent = await Promise.all(
          filesData.map(async (file: any) => {
            const contentRes = await fetch(`/api/files/${file.id}`);
            if (contentRes.ok) {
              const contentData = await contentRes.json();
              return {
                ...file,
                content: contentData.content || "",
              };
            }
            return {
              ...file,
              content: "",
            };
          })
        );
        
        setFiles(filesWithContent);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Loading game editor...</p>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-red-500">Error: {error || "Game not found"}</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 bg-white border-b">
        <h1 className="text-xl font-bold">{game.name}</h1>
        {game.description && <p className="text-gray-600">{game.description}</p>}
      </div>
      
      <div className="flex-1 overflow-hidden">
        <GameEditor
          game={game}
          initialFiles={files}
          onSaveFile={handleSaveFile}
          onCreateFile={handleCreateFile}
        />
      </div>
    </div>
  );
}
