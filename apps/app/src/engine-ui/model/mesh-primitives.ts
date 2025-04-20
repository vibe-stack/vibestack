import { HEMesh, HEVertex, HEFace, HalfEdge } from './mesh'
import { v4 as uuidv4 } from 'uuid'

export function createCubeMesh(): HEMesh {
  // 8 vertices of a unit cube
  const positions: [number, number, number][] = [
    [-0.5, -0.5, -0.5], // 0
    [0.5, -0.5, -0.5],  // 1
    [0.5, 0.5, -0.5],   // 2
    [-0.5, 0.5, -0.5],  // 3
    [-0.5, -0.5, 0.5],  // 4
    [0.5, -0.5, 0.5],   // 5
    [0.5, 0.5, 0.5],    // 6
    [-0.5, 0.5, 0.5],   // 7
  ]
  const vertices: HEVertex[] = positions.map(pos => ({ id: uuidv4(), position: pos, halfEdge: null }))

  // Each face is a quad, defined by 4 vertex indices (CCW)
  const faceVerts = [
    [0, 1, 2, 3], // back
    [5, 4, 7, 6], // front
    [4, 0, 3, 7], // left
    [1, 5, 6, 2], // right
    [3, 2, 6, 7], // top
    [4, 5, 1, 0], // bottom
  ]

  // For each face, create 4 half-edges and 1 face
  const halfEdges: Record<string, HalfEdge> = {}
  const faces: Record<string, HEFace> = {}
  const edgeMap: Record<string, { he: HalfEdge, vStart: number, vEnd: number }> = {}

  // Helper to get a unique key for an edge (undirected)
  const edgeKey = (a: number, b: number) => a < b ? `${a}_${b}` : `${b}_${a}`

  // Create all face half-edges and faces
  faceVerts.forEach((verts) => {
    const faceId = uuidv4()
    const hes: HalfEdge[] = []
    for (let i = 0; i < 4; i++) {
      const vStart = verts[i]
      const vEnd = verts[(i + 1) % 4]
      const he: HalfEdge = {
        id: uuidv4(),
        vertex: vertices[vEnd].id,
        pair: null,
        face: faceId,
        next: '',
        prev: '',
      }
      hes.push(he)
      // Store for pairing
      const k = edgeKey(vStart, vEnd)
      if (!edgeMap[k]) edgeMap[k] = { he, vStart, vEnd }
      else {
        // Pair with the existing half-edge
        he.pair = edgeMap[k].he.id
        edgeMap[k].he.pair = he.id
      }
    }
    // Link next/prev
    for (let i = 0; i < 4; i++) {
      hes[i].next = hes[(i + 1) % 4].id
      hes[i].prev = hes[(i + 3) % 4].id
      halfEdges[hes[i].id] = hes[i]
    }
    // Create face
    faces[faceId] = { id: faceId, halfEdge: hes[0].id }
  })

  // Assign outgoing half-edges to vertices (pick any incident half-edge)
  vertices.forEach(v => {
    v.halfEdge = Object.values(halfEdges).find(he => he.vertex === v.id)?.id || null
  })

  return {
    id: uuidv4(),
    vertices: Object.fromEntries(vertices.map(v => [v.id, v])),
    halfEdges,
    faces,
    modifiers: []
  }
}

export function createPlaneMesh(): HEMesh {
  // 4 vertices of a unit quad in XY plane
  const v0: HEVertex = { id: uuidv4(), position: [-0.5, -0.5, 0], halfEdge: null }
  const v1: HEVertex = { id: uuidv4(), position: [0.5, -0.5, 0], halfEdge: null }
  const v2: HEVertex = { id: uuidv4(), position: [0.5, 0.5, 0], halfEdge: null }
  const v3: HEVertex = { id: uuidv4(), position: [-0.5, 0.5, 0], halfEdge: null }

  // 4 face half-edges (counter-clockwise)
  const he0: HalfEdge = { id: uuidv4(), vertex: v1.id, pair: null, face: '', next: '', prev: '' }
  const he1: HalfEdge = { id: uuidv4(), vertex: v2.id, pair: null, face: '', next: '', prev: '' }
  const he2: HalfEdge = { id: uuidv4(), vertex: v3.id, pair: null, face: '', next: '', prev: '' }
  const he3: HalfEdge = { id: uuidv4(), vertex: v0.id, pair: null, face: '', next: '', prev: '' }

  // Link half-edges in a loop
  he0.next = he1.id; he1.next = he2.id; he2.next = he3.id; he3.next = he0.id
  he0.prev = he3.id; he1.prev = he0.id; he2.prev = he1.id; he3.prev = he2.id

  // 4 outer half-edges (optional, not connected to a face)
  const ohe0: HalfEdge = { id: uuidv4(), vertex: v0.id, pair: he0.id, face: '', next: '', prev: '' }
  const ohe1: HalfEdge = { id: uuidv4(), vertex: v1.id, pair: he1.id, face: '', next: '', prev: '' }
  const ohe2: HalfEdge = { id: uuidv4(), vertex: v2.id, pair: he2.id, face: '', next: '', prev: '' }
  const ohe3: HalfEdge = { id: uuidv4(), vertex: v3.id, pair: he3.id, face: '', next: '', prev: '' }
  he0.pair = ohe0.id; he1.pair = ohe1.id; he2.pair = ohe2.id; he3.pair = ohe3.id

  // 1 face
  const face: HEFace = { id: uuidv4(), halfEdge: he0.id }
  he0.face = face.id; he1.face = face.id; he2.face = face.id; he3.face = face.id

  // Assign outgoing half-edges to vertices
  v0.halfEdge = he3.id
  v1.halfEdge = he0.id
  v2.halfEdge = he1.id
  v3.halfEdge = he2.id

  return {
    id: uuidv4(),
    vertices: { [v0.id]: v0, [v1.id]: v1, [v2.id]: v2, [v3.id]: v3 },
    halfEdges: {
      [he0.id]: he0, [he1.id]: he1, [he2.id]: he2, [he3.id]: he3,
      [ohe0.id]: ohe0, [ohe1.id]: ohe1, [ohe2.id]: ohe2, [ohe3.id]: ohe3
    },
    faces: { [face.id]: face },
    modifiers: []
  }
}

export function createSphereMesh(): HEMesh {
  // TODO: Implement half-edge construction for sphere
  return {
    id: uuidv4(),
    vertices: {},
    halfEdges: {},
    faces: {},
    modifiers: []
  }
}

export function createCylinderMesh(): HEMesh {
  // TODO: Implement half-edge construction for cylinder
  return {
    id: uuidv4(),
    vertices: {},
    halfEdges: {},
    faces: {},
    modifiers: []
  }
} 