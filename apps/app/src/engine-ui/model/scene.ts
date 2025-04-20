import type { Object3D } from './object3d'
import type { HEMesh } from './mesh'
import type { Material } from './material'

export type Scene = {
  id: string
  name: string
  objects: Record<string, Object3D>
  meshes: Record<string, HEMesh>
  materials: Record<string, Material>
  rootObjectId: string
} 