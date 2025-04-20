import * as THREE from 'three'
import { HEMesh } from '../model/mesh'

export function meshToBufferGeometry(mesh: HEMesh): THREE.BufferGeometry {
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
    // Collect the vertex ids for this face by traversing its half-edges
    const faceVerts: string[] = []
    const startHeId = face.halfEdge
    let heId = startHeId
    do {
      const he = mesh.halfEdges[heId]
      faceVerts.push(he.vertex)
      heId = he.next
    } while (heId !== startHeId)
    if (faceVerts.length === 3) {
      indices.push(
        vertexIndexMap[faceVerts[0]],
        vertexIndexMap[faceVerts[1]],
        vertexIndexMap[faceVerts[2]]
      )
    } else if (faceVerts.length === 4) {
      // Triangulate quad: [0,1,2,3] => [0,1,2] and [0,2,3]
      indices.push(
        vertexIndexMap[faceVerts[0]],
        vertexIndexMap[faceVerts[1]],
        vertexIndexMap[faceVerts[2]],
        vertexIndexMap[faceVerts[0]],
        vertexIndexMap[faceVerts[2]],
        vertexIndexMap[faceVerts[3]]
      )
    }
    // TODO: handle ngons (5+ vertices) in the future
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
} 