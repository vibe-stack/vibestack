export type HEVertex = {
  id: string
  position: [number, number, number]
  halfEdge: string | null // one outgoing half-edge from this vertex
}

export type HEFace = {
  id: string
  halfEdge: string // one half-edge bordering this face
}

export type HalfEdge = {
  id: string
  vertex: string // vertex at the end of this half-edge
  pair: string | null // oppositely oriented adjacent half-edge
  face: string // face this half-edge borders
  next: string // next half-edge around the face
  prev: string // previous half-edge around the face
}

export type HEMesh = {
  id: string
  vertices: Record<string, HEVertex>
  halfEdges: Record<string, HalfEdge>
  faces: Record<string, HEFace>
  modifiers: string[]
} 