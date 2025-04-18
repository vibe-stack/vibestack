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
} 