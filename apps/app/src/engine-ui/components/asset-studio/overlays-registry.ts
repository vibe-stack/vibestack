import { VertexSpheres } from './edit-mode/outlines'
import { EdgeLines } from './edit-mode/outlines'
import { FaceMeshes } from './edit-mode/face-meshes'

export const editModeOverlayRegistry = {
  'edit-vertex': VertexSpheres,
  'edit-edge': EdgeLines,
  'edit-face': FaceMeshes,
} as const 