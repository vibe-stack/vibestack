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

export interface Game {
  id: string;
  name: string;
  description?: string;
  files: GameFile[];
}

interface EditorState {
  activeFileId: string | null;
  openFileIds: string[]; // Files that are open in tabs
  selectedNodeId: string | null;
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

  // Scene actions
  setSceneRef: (sceneRef: Scene) => void;
  removeSceneRef: () => void;

  // File actions
  updateFile: (fileId: string, content: string) => void;
  addFile: (file: GameFile) => void;
  removeFile: (fileId: string) => void;

  // Editor state actions
  setActiveFile: (fileId: string | null) => void;
  openFile: (fileId: string) => void;
  closeFile: (fileId: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
}

type GameStore = GameState & GameActions;

export const useGameEditorStore = create<GameStore>()(
  persist(
    (set) => ({
      // Initial state
      game: null,
      isLoading: false,
      error: null,
      editor: {
        activeFileId: null,
        openFileIds: [],
        selectedNodeId: null,
      },
      sceneRef: undefined,

      // Game actions
      setGame: (game) => set({ game, isLoading: false, error: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),

      // Scene actions
      setSceneRef: (sceneRef: Scene) => set({ sceneRef }),
      removeSceneRef: () => set({ sceneRef: undefined }),

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
