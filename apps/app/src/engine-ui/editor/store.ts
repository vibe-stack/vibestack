import type { Scene } from "../model/scene";
import type { Material } from "../model/material";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { v4 as uuidv4 } from "uuid";

export type EditorMode = "object" | "edit-vertex" | "edit-edge" | "edit-face";
export type CameraType = "perspective" | "orthographic";
export type GizmoMode = "translate" | "rotate" | "scale";
export type EditorTool = "select" | "extrude" | "inset" | "loop-cut" | "knife" | "bevel" | null;

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
  setObjectSides: (objectId: string, sides: "front" | "back" | "double") => void;
  setObjectShadow: (objectId: string, options: { cast?: boolean; receive?: boolean }) => void;
  setObjectMaterial: (objectId: string, materialId: string) => void;
  createMaterial: (type: Material["type"], initialProps?: Partial<Material>) => Material;
  updateMaterial: (materialId: string, props: Partial<Material>) => void;
  setObjectName: (objectId: string, name: string) => void;
  setCurrentTool: (tool: EditorTool) => void;
  performLoopCut: (meshId: string, cutData: { faceId: string; cutA: [number, number, number]; cutB: [number, number, number]; edgeA: string; edgeB: string }[]) => void;
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
      console.log("scene", !!scene);
      if (!scene) return;
      const obj = scene.objects[objectId];
      console.log("object", !!obj);
      if (!obj) return;
      console.log("transform", transform);
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
        color: '#22c55e',
        ...initialProps
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
          ...props
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
    performLoopCut: (meshId: string, cutData: { faceId: string; cutA: [number, number, number]; cutB: [number, number, number]; edgeA: string; edgeB: string }[]) => {
      const scene = get().scene;
      if (!scene) return;
      const mesh = scene.meshes[meshId];
      if (!mesh) return;
      const newVertices: Record<string, any> = { ...mesh.vertices };
      const newEdges: Record<string, any> = { ...mesh.edges };
      const newFaces: Record<string, any> = { ...mesh.faces };
      for (const { faceId, cutA, cutB, edgeA, edgeB } of cutData) {
        const face = mesh.faces[faceId];
        if (!face) continue;
        const cutAId = uuidv4();
        const cutBId = uuidv4();
        newVertices[cutAId] = { id: cutAId, position: cutA };
        newVertices[cutBId] = { id: cutBId, position: cutB };
        const verts = face.vertices;
        const edgeAIdx = verts.findIndex((v: any, i: number) => {
          const next = verts[(i + 1) % 4];
          const e = mesh.edges[edgeA];
          return (
            (e.v1 === v && e.v2 === next) || (e.v2 === v && e.v1 === next)
          );
        });
        const edgeBIdx = verts.findIndex((v: any, i: number) => {
          const next = verts[(i + 1) % 4];
          const e = mesh.edges[edgeB];
          return (
            (e.v1 === v && e.v2 === next) || (e.v2 === v && e.v1 === next)
          );
        });
        if (edgeAIdx === -1 || edgeBIdx === -1) continue;
        delete newFaces[faceId];
        const edgeCut = uuidv4();
        newEdges[edgeCut] = { id: edgeCut, v1: cutAId, v2: cutBId };
        const edgeA1 = uuidv4();
        const edgeB1 = uuidv4();
        newEdges[edgeA1] = { id: edgeA1, v1: verts[edgeAIdx], v2: cutAId };
        newEdges[edgeB1] = { id: edgeB1, v1: verts[edgeBIdx], v2: cutBId };
        const f1 = uuidv4();
        const f2 = uuidv4();
        newFaces[f1] = { id: f1, vertices: [verts[edgeAIdx], cutAId, cutBId, verts[edgeBIdx]] };
        newFaces[f2] = { id: f2, vertices: [cutAId, verts[(edgeAIdx+1)%4], verts[(edgeBIdx+1)%4], cutBId] };
      }
      set((draft) => {
        draft.scene!.meshes[meshId] = {
          ...mesh,
          vertices: newVertices,
          edges: newEdges,
          faces: newFaces,
        };
      });
    }
  }))
);
