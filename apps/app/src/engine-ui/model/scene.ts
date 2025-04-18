import type { Object3D } from './object3d'
import type { Mesh } from './mesh'

export type Scene = {
  id: string
  name: string
  objects: Record<string, Object3D>
  meshes: Record<string, Mesh>
  rootObjectId: string
} 