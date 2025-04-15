import { create } from "zustand";
import { Scene } from "three";
import { persist, createJSONStorage } from "zustand/middleware";

export interface GameFile {
  id: string;
  path: string;
  type: string;
  content: string;
  lastModified: Date;
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: Date;
}

export interface Game {
  id: string;
  name: string;
  description?: string;
  files: GameFile[];
  threads: ChatThread[];
}

interface EditorState {
  activeFileId: string | null;
  openFileIds: string[]; // Files that are open in tabs
  selectedNodeId: string | null;
  currentThreadId: string | null;
}

interface GameState {
  game: Game | null;
  isLoading: boolean;
  error: string | null;
  editor: EditorState;
  sceneRef?: Scene;
}

interface GameActions {
  // Game actions
  setGame: (game: Game) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  refreshGame: () => Promise<void>;

  // Scene actions
  setSceneRef: (sceneRef: Scene) => void;
  removeSceneRef: () => void;

  // File actions
  updateFile: (fileId: string, content: string) => void;
  addFile: (file: GameFile) => void;
  removeFile: (fileId: string) => void;

  // Thread actions
  setThreads: (threads: ChatThread[]) => void;
  createThread: (title: string) => Promise<string | null>;

  // Editor state actions
  setActiveFile: (fileId: string | null) => void;
  openFile: (fileId: string) => void;
  closeFile: (fileId: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setCurrentThread: (threadId: string | null) => void;
}

type GameStore = GameState & GameActions;

export const useGameEditorStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial state
      game: null,
      isLoading: true,
      error: null,
      editor: {
        activeFileId: null,
        openFileIds: [],
        selectedNodeId: null,
        currentThreadId: null,
      },
      sceneRef: undefined,

      // Game actions
      setGame: (game) => {
        // Set the most recent thread as active if available
        let currentThreadId = null;
        if (game?.threads && game.threads.length > 0) {
          // Sort threads by creation date (descending) and take the first one
          const sortedThreads = [...game.threads].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          currentThreadId = sortedThreads[0].id;
        }
        
        set({ 
          game, 
          isLoading: false, 
          error: null,
          editor: {
            ...get().editor,
            currentThreadId,
          }
        });
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),
      refreshGame: async () => {
        const state = get();
        if (!state.game) return;
        
        try {
          state.setLoading(true);
          const response = await fetch(`/api/games/${state.game.id}`);
          if (!response.ok) {
            throw new Error("Failed to refresh game");
          }
          
          const gameData = await response.json();
          state.setGame(gameData);
        } catch (error: any) {
          state.setError(error.message || "Failed to refresh game");
        }
      },

      // Scene actions
      setSceneRef: (sceneRef: Scene) => set({ sceneRef }),
      removeSceneRef: () => set({ sceneRef: undefined }),

      // Thread actions
      setThreads: (threads) => 
        set((state) => {
          if (!state.game) return state;
          
          return {
            game: {
              ...state.game,
              threads,
            },
          };
        }),
        
      createThread: async (title) => {
        const state = get();
        if (!state.game) return null;
        
        try {
          const response = await fetch(`/api/games/${state.game.id}/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title }),
          });
          
          if (!response.ok) {
            throw new Error("Failed to create thread");
          }
          
          const thread = await response.json();
          
          // Refresh game data to get updated threads
          await state.refreshGame();
          
          // Set the new thread as active
          state.setCurrentThread(thread.id);
          
          return thread.id;
        } catch (error) {
          console.error("Error creating thread:", error);
          return null;
        }
      },

      // File actions
      updateFile: (fileId, content) =>
        set((state) => {
          if (!state.game) return state;

          const updatedFiles = state.game.files.map((file) =>
            file.id === fileId
              ? { ...file, content, lastModified: new Date() }
              : file
          );

          return {
            game: {
              ...state.game,
              files: updatedFiles,
            },
          };
        }),

      addFile: (file) =>
        set((state) => {
          if (!state.game) return state;

          return {
            game: {
              ...state.game,
              files: [...state.game.files, file],
            },
            editor: {
              ...state.editor,
              activeFileId: file.id,
              openFileIds: [...state.editor.openFileIds, file.id],
            },
          };
        }),

      removeFile: (fileId) =>
        set((state) => {
          if (!state.game) return state;

          const updatedFiles = state.game.files.filter(
            (file) => file.id !== fileId
          );
          const updatedOpenFileIds = state.editor.openFileIds.filter(
            (id) => id !== fileId
          );

          let activeFileId = state.editor.activeFileId;
          if (activeFileId === fileId) {
            activeFileId =
              updatedOpenFileIds.length > 0 ? updatedOpenFileIds[0] : null;
          }

          return {
            game: {
              ...state.game,
              files: updatedFiles,
            },
            editor: {
              ...state.editor,
              activeFileId,
              openFileIds: updatedOpenFileIds,
            },
          };
        }),

      // Editor state actions
      setActiveFile: (fileId) =>
        set((state) => ({
          editor: {
            ...state.editor,
            activeFileId: fileId,
          },
        })),

      openFile: (fileId) =>
        set((state) => ({
          editor: {
            ...state.editor,
            activeFileId: fileId,
            openFileIds: state.editor.openFileIds.includes(fileId)
              ? state.editor.openFileIds
              : [...state.editor.openFileIds, fileId],
          },
        })),

      closeFile: (fileId) =>
        set((state) => {
          const updatedOpenFileIds = state.editor.openFileIds.filter(
            (id) => id !== fileId
          );

          let activeFileId = state.editor.activeFileId;
          if (activeFileId === fileId) {
            activeFileId =
              updatedOpenFileIds.length > 0 ? updatedOpenFileIds[0] : null;
          }

          return {
            editor: {
              ...state.editor,
              activeFileId,
              openFileIds: updatedOpenFileIds,
            },
          };
        }),

      setSelectedNode: (nodeId) =>
        set((state) => ({
          editor: {
            ...state.editor,
            selectedNodeId: nodeId,
          },
        })),
        
      setCurrentThread: (threadId) =>
        set((state) => ({
          editor: {
            ...state.editor,
            currentThreadId: threadId,
          },
        })),
    }),
    {
      name: "game-editor-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        editor: state.editor,
      }),
    }
  )
);
