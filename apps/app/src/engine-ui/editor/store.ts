import type { Scene } from "../model/scene";
import type { Material } from "../model/material";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { v4 as uuidv4 } from "uuid";

export type EditorMode = "object" | "edit-vertex" | "edit-edge" | "edit-face";
export type CameraType = "perspective" | "orthographic";
export type GizmoMode = "translate" | "rotate" | "scale";
export type EditorTool =
  | "select"
  | "extrude"
  | "inset"
  | "loop-cut"
  | "knife"
  | "bevel"
  | null;

export type LoopCutFace = { faceId: string; edgeA: string; edgeB: string };

export type EditorState = {
  scene: Scene | null;
  selection: {
    objectIds: string[];
    elementType?: "vertex" | "edge" | "face";
    elementIds?: string[];
  };
  mode: EditorMode;
  cameraType: CameraType;
  orbitControlsEnabled: boolean;
  gizmoMode: GizmoMode;
  currentTool: EditorTool;
  setScene: (scene: Scene) => void;
  setSelection: (selection: EditorState["selection"]) => void;
  setMode: (mode: EditorMode) => void;
  setCameraType: (type: CameraType) => void;
  setOrbitControlsEnabled: (enabled: boolean) => void;
  setGizmoMode: (mode: GizmoMode) => void;
  setObjectTransform: (
    objectId: string,
    transform: {
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
    }
  ) => void;
  setObjectVisibility: (objectId: string, visible: boolean) => void;
  setObjectWireframe: (objectId: string, wireframe: boolean) => void;
  setObjectShading: (objectId: string, shading: "flat" | "smooth") => void;
  setObjectSides: (
    objectId: string,
    sides: "front" | "back" | "double"
  ) => void;
  setObjectShadow: (
    objectId: string,
    options: { cast?: boolean; receive?: boolean }
  ) => void;
  setObjectMaterial: (objectId: string, materialId: string) => void;
  createMaterial: (
    type: Material["type"],
    initialProps?: Partial<Material>
  ) => Material;
  updateMaterial: (materialId: string, props: Partial<Material>) => void;
  setObjectName: (objectId: string, name: string) => void;
  setCurrentTool: (tool: EditorTool) => void;
  performLoopCut: () => void;
};

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    scene: null,
    selection: { objectIds: [] },
    mode: "object",
    cameraType: "perspective",
    orbitControlsEnabled: true,
    gizmoMode: "translate",
    currentTool: null,
    setScene: (scene) => {
      set((draft) => {
        draft.scene = scene;
      });
    },
    setSelection: (selection) => set({ selection }),
    setMode: (mode) => set({ mode }),
    setCameraType: (type) => set({ cameraType: type }),
    setOrbitControlsEnabled: (enabled) =>
      set({ orbitControlsEnabled: enabled }),
    setGizmoMode: (mode) => set({ gizmoMode: mode }),
    setObjectTransform: (objectId, transform) => {
      const scene = get().scene;
      if (!scene) return;
      const obj = scene.objects[objectId];
      if (!obj) return;
      set((draft) => {
        draft.scene!.objects[objectId].transform = {
          position: transform.position,
          rotation: transform.rotation,
          scale: transform.scale,
        };
      });
    },
    setObjectVisibility: (objectId, visible) => {
      const scene = get().scene;
      if (!scene) return;
      const obj = scene.objects[objectId];
      if (!obj) return;
      set((draft) => {
        draft.scene!.objects[objectId].visible = visible;
      });
    },
    setObjectWireframe: (objectId, wireframe) => {
      const scene = get().scene;
      if (!scene) return;
      const obj = scene.objects[objectId];
      if (!obj) return;
      set((draft) => {
        draft.scene!.objects[objectId].wireframe = wireframe;
      });
    },
    setObjectShading: (objectId, shading) => {
      const scene = get().scene;
      if (!scene) return;
      const obj = scene.objects[objectId];
      if (!obj) return;
      set((draft) => {
        draft.scene!.objects[objectId].shading = shading;
      });
    },
    setObjectSides: (objectId, sides) => {
      const scene = get().scene;
      if (!scene) return;
      const obj = scene.objects[objectId];
      if (!obj) return;
      set((draft) => {
        draft.scene!.objects[objectId].sides = sides;
      });
    },
    setObjectShadow: (objectId, options) => {
      const scene = get().scene;
      if (!scene) return;
      const obj = scene.objects[objectId];
      if (!obj) return;
      set((draft) => {
        if (options.cast !== undefined) {
          draft.scene!.objects[objectId].castShadow = options.cast;
        }
        if (options.receive !== undefined) {
          draft.scene!.objects[objectId].receiveShadow = options.receive;
        }
      });
    },
    setObjectMaterial: (objectId, materialId) => {
      const scene = get().scene;
      if (!scene) return;
      const obj = scene.objects[objectId];
      if (!obj) return;
      set((draft) => {
        draft.scene!.objects[objectId].materialId = materialId;
      });
    },
    createMaterial: (type, initialProps = {}) => {
      const materialId = uuidv4();
      const material: Material = {
        id: materialId,
        name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        type,
        color: "#22c55e",
        ...initialProps,
      };

      set((draft) => {
        if (!draft.scene) return;
        draft.scene.materials = draft.scene.materials || {};
        draft.scene.materials[materialId] = material;
      });

      return material;
    },
    updateMaterial: (materialId, props) => {
      const scene = get().scene;
      if (!scene || !scene.materials || !scene.materials[materialId]) return;

      set((draft) => {
        if (!draft.scene || !draft.scene.materials) return;
        draft.scene.materials[materialId] = {
          ...draft.scene.materials[materialId],
          ...props,
        };
      });
    },
    setObjectName: (objectId, name) => {
      const scene = get().scene;
      if (!scene) return;
      const obj = scene.objects[objectId];
      if (!obj) return;
      set((draft) => {
        draft.scene!.objects[objectId].name = name;
      });
    },
    setCurrentTool: (tool) => set({ currentTool: tool }),
    performLoopCut: () => {
      // TODO: Refactor for half-edge mesh
    },
  }))
);
