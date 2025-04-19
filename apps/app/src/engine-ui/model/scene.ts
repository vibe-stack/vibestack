import type { Object3D } from './object3d'
import type { Mesh } from './mesh'
import type { Material } from './material'

export type Scene = {
  id: string
  name: string
  objects: Record<string, Object3D>
  meshes: Record<string, Mesh>
  materials: Record<string, Material>
  rootObjectId: string
} 