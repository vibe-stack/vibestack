export type Object3D = {
  id: string
  name: string
  type: 'mesh' | 'group' | 'light' | 'camera'
  transform: {
    position: [number, number, number]
    rotation: [number, number, number]
    scale: [number, number, number]
  }
  parent: string | null
  children: string[]
  meshId?: string
  
  // Material properties
  materialId?: string
  
  // Display properties
  visible: boolean
  wireframe?: boolean
  shading: 'flat' | 'smooth'
  sides: 'front' | 'back' | 'double'
  
  // Shadow properties
  castShadow: boolean
  receiveShadow: boolean
} 