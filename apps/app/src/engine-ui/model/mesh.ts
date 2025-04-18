export type Vertex = { id: string; position: [number, number, number] }
export type Edge = { id: string; v1: string; v2: string }
export type Face = { id: string; vertices: string[] }

export type Mesh = {
  id: string
  vertices: Record<string, Vertex>
  edges: Record<string, Edge>
  faces: Record<string, Face>
  modifiers: string[]
} 