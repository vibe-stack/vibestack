import { VertexSpheres } from "./edit-mode/outlines";
import { EdgeLines } from "./edit-mode/outlines";
import { FaceMeshes } from "./edit-mode/face-meshes";
import { LoopCutOverlay } from "./edit-mode/loop-cut-overlay";

export const editModeOverlayRegistry = {
  "edit-vertex": VertexSpheres,
  "edit-edge": EdgeLines,
  "edit-face": FaceMeshes,
  "loop-cut": LoopCutOverlay,
} as const;
