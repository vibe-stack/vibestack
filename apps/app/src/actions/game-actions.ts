import type { Game, GameFile, ChatThread } from "@/store/game-editor-store";

export async function fetchGame(gameId: string): Promise<Game> {
  const res = await fetch(`/api/games/${gameId}`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch game: ${res.statusText}`);
  }
  
  const gameData = await res.json();
  
  // Fetch all the files for this game
  const filesRes = await fetch(`/api/games/${gameId}/files`);
  
  if (!filesRes.ok) {
    throw new Error(`Failed to fetch game files: ${filesRes.statusText}`);
  }
  
  const filesData = await filesRes.json();
  
  // Fetch all chat threads for this game
  const threadsRes = await fetch(`/api/games/${gameId}/chat`);
  let threads: ChatThread[] = [];
  
  if (threadsRes.ok) {
    const threadsData = await threadsRes.json();
    threads = threadsData.map((thread: any) => ({
      id: thread.id,
      title: thread.title || `Thread ${thread.id}`,
      createdAt: new Date(thread.createdAt || Date.now())
    }));
  }
  
  // For each file, fetch its content
  const filesWithContent = await Promise.all(
    filesData.map(async (file: any) => {
      const contentRes = await fetch(`/api/files/${file.id}`);
      if (contentRes.ok) {
        const contentData = await contentRes.json();
        return {
          ...file,
          content: contentData.content || "",
          lastModified: new Date(file.updatedAt || Date.now())
        } as GameFile;
      }
      return {
        ...file,
        content: "",
        lastModified: new Date(file.updatedAt || Date.now())
      } as GameFile;
    })
  );
  
  return {
    ...gameData,
    files: filesWithContent,
    threads
  };
}

export async function saveGameFile(fileId: string, content: string): Promise<void> {
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
    throw new Error(`Failed to save file: ${res.statusText}`);
  }
}

export async function createGameFile(
  gameId: string, 
  path: string, 
  type: string, 
  content: string
): Promise<GameFile> {
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
    throw new Error(`Failed to create file: ${res.statusText}`);
  }

  const fileData = await res.json();
  
  return {
    ...fileData,
    content,
    lastModified: new Date()
  };
}

export async function deleteGameFile(fileId: string): Promise<void> {
  const res = await fetch(`/api/files/${fileId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(`Failed to delete file: ${res.statusText}`);
  }
} 