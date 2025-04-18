import { create } from 'zustand'
import type { Scene } from '../model/scene'

export type EditorMode = 'object' | 'edit-vertex' | 'edit-edge' | 'edit-face'
export type CameraType = 'perspective' | 'orthographic'

export type EditorState = {
  scene: Scene | null
  selection: {
    objectIds: string[]
    elementType?: 'vertex' | 'edge' | 'face'
    elementIds?: string[]
  }
  mode: EditorMode
  cameraType: CameraType
  setScene: (scene: Scene) => void
  setSelection: (selection: EditorState['selection']) => void
  setMode: (mode: EditorMode) => void
  setCameraType: (type: CameraType) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  scene: null,
  selection: { objectIds: [] },
  mode: 'object',
  cameraType: 'perspective',
  setScene: (scene) => set({ scene }),
  setSelection: (selection) => set({ selection }),
  setMode: (mode) => set({ mode }),
  setCameraType: (type) => set({ cameraType: type }),
})) 