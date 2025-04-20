import { Scene } from './scene'
import { Object3D } from './object3d'
import { HEMesh } from './mesh'
import { Material } from './material'
import { v4 as uuidv4 } from 'uuid'

export function createDefaultScene(): Scene {
  const meshId = uuidv4()
  const rootObjectId = uuidv4()
  const defaultMaterialId = uuidv4()

  // Create a default green material
  const defaultMaterial: Material = {
    id: defaultMaterialId,
    name: 'Default Green',
    type: 'standard',
    color: '#22c55e', // Green color
    wireframe: false,
    roughness: 0.5,
    metalness: 0.0
  }

  const mesh: HEMesh = {
    id: meshId,
    vertices: {},
    halfEdges: {},
    faces: {},
    modifiers: [],
  }

  const rootObject: Object3D = {
    id: rootObjectId,
    name: 'Root',
    type: 'group',
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    parent: null,
    children: [],
    // Display properties
    visible: true,
    shading: 'smooth',
    sides: 'front',
    // Shadow properties
    castShadow: true,
    receiveShadow: true
  }

  return {
    id: uuidv4(),
    name: 'Default Scene',
    objects: { [rootObjectId]: rootObject },
    meshes: { [meshId]: mesh },
    materials: { [defaultMaterialId]: defaultMaterial },
    rootObjectId,
  }
} 