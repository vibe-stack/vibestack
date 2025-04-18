import * as THREE from 'three'
import { Mesh } from '../model/mesh'

export function meshToBufferGeometry(mesh: Mesh): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()
  const vertices: number[] = []
  const indices: number[] = []
  const vertexIndexMap: Record<string, number> = {}
  let i = 0
  for (const vId in mesh.vertices) {
    const v = mesh.vertices[vId]
    vertices.push(...v.position)
    vertexIndexMap[vId] = i++
  }
  for (const faceId in mesh.faces) {
    const face = mesh.faces[faceId]
    if (face.vertices.length === 3) {
      indices.push(
        vertexIndexMap[face.vertices[0]],
        vertexIndexMap[face.vertices[1]],
        vertexIndexMap[face.vertices[2]]
      )
    }
    // TODO: handle quads/ngons
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
} 