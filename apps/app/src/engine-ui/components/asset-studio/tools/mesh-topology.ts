import * as THREE from 'three'

export type Vertex = {
  id: string
  position: [number, number, number]
}

export type Edge = {
  id: string
  vertexIds: [string, string]
}

export type Face = {
  id: string
  vertexIds: string[]
}

export type MeshTopology = {
  vertices: Vertex[]
  edges: Edge[]
  faces: Face[]
}

export function meshTopologyToBufferGeometry(topology: MeshTopology): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()
  const positions: number[] = []
  const indices: number[] = []
  const vertexIdToIndex = new Map<string, number>()

  topology.vertices.forEach((v, i) => {
    positions.push(...v.position)
    vertexIdToIndex.set(v.id, i)
  })

  topology.faces.forEach(face => {
    if (face.vertexIds.length < 3) return
    for (let i = 1; i < face.vertexIds.length - 1; i++) {
      const a = vertexIdToIndex.get(face.vertexIds[0])
      const b = vertexIdToIndex.get(face.vertexIds[i])
      const c = vertexIdToIndex.get(face.vertexIds[i + 1])
      if (a !== undefined && b !== undefined && c !== undefined) {
        indices.push(a, b, c)
      }
    }
  })

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  if (indices.length > 0) {
    geometry.setIndex(indices)
  }
  geometry.computeVertexNormals()
  return geometry
} 