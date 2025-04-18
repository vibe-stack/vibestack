import { Scene } from './scene'
import { Object3D } from './object3d'
import { Mesh } from './mesh'
import { v4 as uuidv4 } from 'uuid'

export function createDefaultScene(): Scene {
  const meshId = uuidv4()
  const rootObjectId = uuidv4()

  const mesh: Mesh = {
    id: meshId,
    vertices: {
      v1: { id: 'v1', position: [0, 0, 0] },
      v2: { id: 'v2', position: [1, 0, 0] },
      v3: { id: 'v3', position: [0, 1, 0] },
    },
    edges: {
      e1: { id: 'e1', v1: 'v1', v2: 'v2' },
      e2: { id: 'e2', v1: 'v2', v2: 'v3' },
      e3: { id: 'e3', v1: 'v3', v2: 'v1' },
    },
    faces: {
      f1: { id: 'f1', vertices: ['v1', 'v2', 'v3'] },
    },
    modifiers: [],
  }

  const rootObject: Object3D = {
    id: rootObjectId,
    name: 'Root',
    type: 'mesh',
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    parent: null,
    children: [],
    meshId,
  }

  return {
    id: uuidv4(),
    name: 'Default Scene',
    objects: { [rootObjectId]: rootObject },
    meshes: { [meshId]: mesh },
    rootObjectId,
  }
} 