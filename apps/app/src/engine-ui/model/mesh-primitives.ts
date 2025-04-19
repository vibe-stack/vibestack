import { Mesh } from './mesh'
import { v4 as uuidv4 } from 'uuid'

export function createCubeMesh(): Mesh {
  const id = uuidv4()
  const v = (x: number, y: number, z: number) => ({ id: uuidv4(), position: [x, y, z] as [number, number, number] })
  // 0: left-bottom-back, 1: right-bottom-back, 2: right-top-back, 3: left-top-back
  // 4: left-bottom-front, 5: right-bottom-front, 6: right-top-front, 7: left-top-front
  const vertices = [
    v(-0.5, -0.5, -0.5), v(0.5, -0.5, -0.5), v(0.5, 0.5, -0.5), v(-0.5, 0.5, -0.5),
    v(-0.5, -0.5, 0.5), v(0.5, -0.5, 0.5), v(0.5, 0.5, 0.5), v(-0.5, 0.5, 0.5)
  ]
  const verts = Object.fromEntries(vertices.map(v => [v.id, v]))
  const edges = [
    [0,1],[1,2],[2,3],[3,0], [4,5],[5,6],[6,7],[7,4], [0,4],[1,5],[2,6],[3,7]
  ].map(([a,b]) => {
    const id = uuidv4(); return [id, { id, v1: vertices[a].id, v2: vertices[b].id }] })
  // Explicit triangles for each face, reversed winding (CCW from outside)
  const faceTris = [
    // back (-z)
    [2, 1, 0], [3, 2, 0],
    // front (+z)
    [5, 6, 4], [6, 7, 4],
    // left (-x)
    [7, 3, 0], [4, 7, 0],
    // right (+x)
    [6, 5, 1], [2, 6, 1],
    // bottom (-y)
    [5, 4, 0], [1, 5, 0],
    // top (+y)
    [6, 2, 3], [7, 6, 3],
  ]
  const faces: [string, { id: string, vertices: string[] }][] = faceTris.map(tri => {
    const id = uuidv4();
    return [id, { id, vertices: tri.map(i => vertices[i].id) }]
  })
  return {
    id,
    vertices: verts,
    edges: Object.fromEntries(edges),
    faces: Object.fromEntries(faces),
    modifiers: []
  }
}

export function createPlaneMesh(): Mesh {
  const id = uuidv4()
  const v = (x: number, y: number, z: number) => ({ id: uuidv4(), position: [x, y, z] as [number, number, number] })
  const vertices = [v(-0.5, -0.5, 0), v(0.5, -0.5, 0), v(0.5, 0.5, 0), v(-0.5, 0.5, 0)]
  const verts = Object.fromEntries(vertices.map(v => [v.id, v]))
  const edges = [[0,1],[1,2],[2,3],[3,0]].map(([a,b]) => {
    const id = uuidv4(); return [id, { id, v1: vertices[a].id, v2: vertices[b].id }] })
  const faces = [[0,1,2],[0,2,3]].map(vertsIdxs => {
    const id = uuidv4(); return [id, { id, vertices: vertsIdxs.map(i => vertices[i].id) }] })
  return {
    id,
    vertices: verts,
    edges: Object.fromEntries(edges),
    faces: Object.fromEntries(faces),
    modifiers: []
  }
}

export function createSphereMesh(segments = 8, rings = 6): Mesh {
  const id = uuidv4()
  const v = (x: number, y: number, z: number) => ({ id: uuidv4(), position: [x, y, z] as [number, number, number] })
  const vertices: ReturnType<typeof v>[] = []
  for (let y = 0; y <= rings; y++) {
    const phi = Math.PI * y / rings
    for (let x = 0; x <= segments; x++) {
      const theta = 2 * Math.PI * x / segments
      vertices.push(v(
        Math.sin(phi) * Math.cos(theta) * 0.5,
        Math.cos(phi) * 0.5,
        Math.sin(phi) * Math.sin(theta) * 0.5
      ))
    }
  }
  const verts = Object.fromEntries(vertices.map(v => [v.id, v]))
  const edgeSet = new Set<string>()
  const edges: [string, { id: string, v1: string, v2: string }][] = []
  const faces: [string, { id: string, vertices: string[] }][] = []
  function addEdge(a: string, b: string) {
    const key = [a, b].sort().join('-')
    if (!edgeSet.has(key)) {
      edgeSet.add(key)
      edges.push([uuidv4(), { id: uuidv4(), v1: a, v2: b }])
    }
  }
  for (let y = 0; y < rings; y++) {
    for (let x = 0; x < segments; x++) {
      const i = y * (segments + 1) + x
      const v1 = vertices[i].id
      const v2 = vertices[i + 1].id
      const v3 = vertices[i + segments + 1].id
      const v4 = vertices[i + segments + 2].id
      // Two triangles per quad
      faces.push([uuidv4(), { id: uuidv4(), vertices: [v1, v2, v3] }])
      faces.push([uuidv4(), { id: uuidv4(), vertices: [v2, v4, v3] }])
      // Add edges for both triangles (v1,v2,v3) and (v2,v4,v3)
      addEdge(v1, v2)
      addEdge(v2, v3)
      addEdge(v3, v1)
      addEdge(v2, v4)
      addEdge(v4, v3)
    }
  }
  return {
    id,
    vertices: verts,
    edges: Object.fromEntries(edges),
    faces: Object.fromEntries(faces),
    modifiers: []
  }
}

export function createCylinderMesh(segments = 12): Mesh {
  const id = uuidv4()
  const v = (x: number, y: number, z: number) => ({ id: uuidv4(), position: [x, y, z] as [number, number, number] })
  const vertices: ReturnType<typeof v>[] = []
  // bottom ring
  for (let i = 0; i < segments; i++) {
    const theta = 2 * Math.PI * i / segments
    vertices.push(v(Math.cos(theta) * 0.5, -0.5, Math.sin(theta) * 0.5))
  }
  // top ring
  for (let i = 0; i < segments; i++) {
    const theta = 2 * Math.PI * i / segments
    vertices.push(v(Math.cos(theta) * 0.5, 0.5, Math.sin(theta) * 0.5))
  }
  // center bottom and top
  const centerBottom = v(0, -0.5, 0)
  const centerTop = v(0, 0.5, 0)
  vertices.push(centerBottom)
  vertices.push(centerTop)
  const verts = Object.fromEntries(vertices.map(v => [v.id, v]))
  const edges: [string, { id: string, v1: string, v2: string }][] = []
  const faces: [string, { id: string, vertices: string[] }][] = []
  // side faces
  for (let i = 0; i < segments; i++) {
    const b1 = vertices[i].id
    const t1 = vertices[i + segments].id
    const b2 = vertices[(i + 1) % segments].id
    const t2 = vertices[((i + 1) % segments) + segments].id
    // two triangles per quad, reversed winding (CCW from outside)
    const id1 = uuidv4();
    const id2 = uuidv4();
    faces.push([id1, { id: id1, vertices: [t1, b2, b1] }])
    faces.push([id2, { id: id2, vertices: [t1, t2, b2] }])
    edges.push([uuidv4(), { id: uuidv4(), v1: b1, v2: b2 }])
    edges.push([uuidv4(), { id: uuidv4(), v1: t1, v2: t2 }])
    edges.push([uuidv4(), { id: uuidv4(), v1: b1, v2: t1 }])
    edges.push([uuidv4(), { id: uuidv4(), v1: b2, v2: t2 }])
  }
  // bottom cap
  const bottomCenterIdx = vertices.length - 2
  for (let i = 0; i < segments; i++) {
    const b1 = vertices[i].id
    const b2 = vertices[(i + 1) % segments].id
    const c = vertices[bottomCenterIdx].id
    const idf = uuidv4()
    faces.push([idf, { id: idf, vertices: [c, b1, b2] }]) // CCW when looking up
    edges.push([uuidv4(), { id: uuidv4(), v1: c, v2: b1 }])
    edges.push([uuidv4(), { id: uuidv4(), v1: c, v2: b2 }])
  }
  // top cap
  const topCenterIdx = vertices.length - 1
  for (let i = 0; i < segments; i++) {
    const t1 = vertices[i + segments].id
    const t2 = vertices[((i + 1) % segments) + segments].id
    const c = vertices[topCenterIdx].id
    const idf = uuidv4()
    faces.push([idf, { id: idf, vertices: [c, t2, t1] }]) // CCW when looking down
    edges.push([uuidv4(), { id: uuidv4(), v1: c, v2: t1 }])
    edges.push([uuidv4(), { id: uuidv4(), v1: c, v2: t2 }])
  }
  return {
    id,
    vertices: verts,
    edges: Object.fromEntries(edges),
    faces: Object.fromEntries(faces),
    modifiers: []
  }
} 