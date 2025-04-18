import { create } from "zustand";
import * as THREE from "three";

// Types
export type CameraType = "perspective" | "orthographic";

export interface GeometryParameters {
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  widthSegments?: number;
  heightSegments?: number;
  depthSegments?: number;
  radialSegments?: number;
  vertices?: [number, number, number][]; // Store vertices as array of [x,y,z] coordinates
  positions?: number[]; // flat array of vertex positions
  indices?: number[]; // flat array of indices
  normals?: number[]; // flat array of normals
  uvs?: number[]; // flat array of uvs
}

export interface ThreeDObject {
  id: string;
  name: string;
  type: string; // "mesh", "light", "camera", etc.
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  visible: boolean;
  expanded?: boolean; // Whether the node is expanded in the scene tree
  // Additional properties based on type
  userData: {
    // Mesh properties
    geometry?: {
      type: "box" | "sphere" | "cylinder" | "plane" | "torus" | "custom";
      parameters?: GeometryParameters;
    };
    material?: {
      type: "standard" | "basic" | "phong" | "lambert" | "normal" | "wireframe";
      color?: string;
      wireframe?: boolean;
      side?: "front" | "back" | "double";
      flatShading?: boolean;
    };
    // Mesh topology for editable geometry
    meshTopology?: import("@/engine-ui/components/asset-studio/tools/mesh-topology").MeshTopology;
    // Light properties
    light?: {
      color?: string;
      intensity?: number;
      distance?: number;
      castShadow?: boolean;
    };
    // Shadow properties
    castShadow?: boolean;
    receiveShadow?: boolean;
  };
  children?: ThreeDObject[];
}

export interface UndoRedoAction {
  type: string;
  data: Record<string, unknown>;
  undo: () => void;
  redo: () => void;
}

// Define tool types
export type ToolType =
  | "select"
  | "translate"
  | "rotate"
  | "scale"
  | "cube"
  | "sphere"
  | "cylinder"
  | "plane"
  | "pointLight"
  | "directionalLight";

interface ThreeDEditorState {
  // Scene graph
  objects: ThreeDObject[];
  selectedObjectId: string | null;
  scene?: THREE.Scene;
  
  // Camera settings
  cameraType: CameraType;
  perspectiveCamera?: THREE.PerspectiveCamera;
  orthographicCamera?: THREE.OrthographicCamera;
  activeCamera?: THREE.Camera;
  
  // History for undo/redo
  history: UndoRedoAction[];
  historyIndex: number;
  
  // UI state
  isPanelOpen: {
    sceneTree: boolean;
    inspector: boolean;
  };

  // Editor/toolbar state
  isEditing: boolean;
  editMode: null | "vertex" | "edge" | "face";
  activeTool: ToolType;
}

interface ThreeDEditorActions {
  // Scene management
  addObject: (object: Partial<ThreeDObject>) => void;
  removeObject: (id: string) => void;
  updateObject: (id: string, updates: Partial<ThreeDObject>) => void;
  selectObject: (id: string | null) => void;
  setScene: (scene: THREE.Scene) => void;
  
  // Camera controls
  setCameraType: (type: CameraType) => void;
  setPerspectiveCamera: (camera: THREE.PerspectiveCamera) => void;
  setOrthographicCamera: (camera: THREE.OrthographicCamera) => void;
  
  // History management
  addHistoryAction: (action: UndoRedoAction) => void;
  undo: () => void;
  redo: () => void;
  
  // UI state management
  togglePanel: (panel: keyof ThreeDEditorState["isPanelOpen"]) => void;

  // Editor/toolbar state actions
  setIsEditing: (v: boolean) => void;
  setEditMode: (v: null | "vertex" | "edge" | "face") => void;
  setActiveTool: (tool: ToolType) => void;
}

type ThreeDEditorStore = ThreeDEditorState & ThreeDEditorActions;

export const useThreeDEditorStore = create<ThreeDEditorStore>()((set, get) => ({
  // Initial state
  objects: [],
  selectedObjectId: null,
  cameraType: "perspective",
  history: [],
  historyIndex: -1,
  isPanelOpen: {
    sceneTree: true,
    inspector: true,
  },
  // Editor/toolbar state
  isEditing: false,
  editMode: null,
  activeTool: "select",
  
  // Actions
  addObject: (object) => {
    const newObject: ThreeDObject = {
      id: object.id || `obj_${Math.random().toString(36).substr(2, 9)}`,
      name: object.name || "New Object",
      type: object.type || "mesh",
      position: object.position || new THREE.Vector3(0, 0, 0),
      rotation: object.rotation || new THREE.Euler(0, 0, 0),
      scale: object.scale || new THREE.Vector3(1, 1, 1),
      visible: object.visible !== undefined ? object.visible : true,
      userData: object.userData || {},
      children: object.children || [],
    };
    
    set((state) => ({ 
      objects: [...state.objects, newObject] 
    }));
    
    // Add to history
    const historyAction: UndoRedoAction = {
      type: "ADD_OBJECT",
      data: { object: newObject },
      undo: () => {
        get().removeObject(newObject.id);
      },
      redo: () => {
        get().addObject(newObject);
      }
    };
    get().addHistoryAction(historyAction);
  },
  
  removeObject: (id) => {
    const state = get();
    const objectToRemove = state.objects.find(obj => obj.id === id);
    
    if (!objectToRemove) return;
    
    set((state) => ({ 
      objects: state.objects.filter(obj => obj.id !== id),
      selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId
    }));
    
    // Add to history
    const historyAction: UndoRedoAction = {
      type: "REMOVE_OBJECT",
      data: { object: objectToRemove },
      undo: () => {
        get().addObject(objectToRemove);
      },
      redo: () => {
        get().removeObject(id);
      }
    };
    get().addHistoryAction(historyAction);
  },
  
  updateObject: (id, updates) => {
    const state = get();
    const objectToUpdate = state.objects.find(obj => obj.id === id);
    
    if (!objectToUpdate) return;
    
    const previousState = { ...objectToUpdate };
    
    set((state) => ({
      objects: state.objects.map(obj => 
        obj.id === id ? { ...obj, ...updates } : obj
      )
    }));
    
    // Add to history
    const historyAction: UndoRedoAction = {
      type: "UPDATE_OBJECT",
      data: { id, previousState, updates },
      undo: () => {
        get().updateObject(id, previousState);
      },
      redo: () => {
        get().updateObject(id, updates);
      }
    };
    get().addHistoryAction(historyAction);
  },
  
  selectObject: (id) => {
    set({ selectedObjectId: id });
  },
  
  setScene: (scene) => {
    set({ scene });
  },
  
  setCameraType: (type) => {
    set({ cameraType: type });
    
    // Activate the appropriate camera
    const state = get();
    if (type === "perspective" && state.perspectiveCamera) {
      set({ activeCamera: state.perspectiveCamera });
    } else if (type === "orthographic" && state.orthographicCamera) {
      set({ activeCamera: state.orthographicCamera });
    }
  },
  
  setPerspectiveCamera: (camera) => {
    set({ 
      perspectiveCamera: camera,
      activeCamera: get().cameraType === "perspective" ? camera : get().activeCamera
    });
  },
  
  setOrthographicCamera: (camera) => {
    set({ 
      orthographicCamera: camera,
      activeCamera: get().cameraType === "orthographic" ? camera : get().activeCamera
    });
  },
  
  addHistoryAction: (action) => {
    const { history, historyIndex } = get();
    
    // Remove any future actions if we're adding after undoing
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(action);
    
    set({
      history: newHistory,
      historyIndex: historyIndex + 1
    });
  },
  
  undo: () => {
    const { history, historyIndex } = get();
    
    if (historyIndex >= 0) {
      const action = history[historyIndex];
      action.undo();
      set({ historyIndex: historyIndex - 1 });
    }
  },
  
  redo: () => {
    const { history, historyIndex } = get();
    
    if (historyIndex < history.length - 1) {
      const action = history[historyIndex + 1];
      action.redo();
      set({ historyIndex: historyIndex + 1 });
    }
  },
  
  togglePanel: (panel) => {
    set((state) => ({
      isPanelOpen: {
        ...state.isPanelOpen,
        [panel]: !state.isPanelOpen[panel]
      }
    }));
  },

  // Editor/toolbar state actions
  setIsEditing: (v) => set({ isEditing: v }),
  setEditMode: (v) => set({ editMode: v }),
  setActiveTool: (tool) => set({ activeTool: tool }),
})); 