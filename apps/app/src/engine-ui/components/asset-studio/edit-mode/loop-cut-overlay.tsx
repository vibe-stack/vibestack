import { useEditorStore } from '../../../editor/store'
import { useState } from 'react'
import { Line } from '@react-three/drei'
import { splitEdgeLoop, splitFace } from '@/engine-ui/model/mesh-primitives'
import type { HEMesh } from '@/engine-ui/model/mesh'

function findEdgeLoop(mesh: HEMesh, startEdgeId: string): string[] {
  const loop: string[] = []
  const visited = new Set<string>()

  // Helper to step across a quad: edge -> pair -> next -> next
  function step(edgeId: string | undefined): string | undefined {
    if (!edgeId) return undefined
    const he = mesh.halfEdges[edgeId]
    if (!he || !he.pair) return undefined
    const pair = mesh.halfEdges[he.pair]
    if (!pair) return undefined
    const next1 = mesh.halfEdges[pair.next]
    if (!next1) return undefined
    const next2 = mesh.halfEdges[next1.next]
    if (!next2) return undefined
    return next2.id
  }

  // Forward
  let current: string | undefined = startEdgeId
  while (current && !visited.has(current)) {
    visited.add(current)
    loop.push(current)
    const next = step(current)
    if (!next || next === startEdgeId) break
    current = next
  }

  // Backward
  current = step(step(startEdgeId)) // step twice in reverse
  while (current && !visited.has(current)) {
    visited.add(current)
    loop.unshift(current)
    const prev = step(current)
    if (!prev || prev === startEdgeId) break
    current = prev
  }

  return loop
}

export function LoopCutOverlay({
  mesh,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
}: {
  mesh: HEMesh
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
}) {
  const setScene = useEditorStore((s) => s.setScene)
  const scene = useEditorStore((s) => s.scene)
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null)
  const [previewLoop, setPreviewLoop] = useState<string[]>([])

  function handlePointerOver(edgeId: string) {
    setHoveredEdge(edgeId)
    const loop = findEdgeLoop(mesh, edgeId)
    setPreviewLoop(loop)
  }

  function handlePointerOut() {
    setHoveredEdge(null)
    setPreviewLoop([])
  }

  function handleClick() {
    if (!scene) return
    const meshCopy: HEMesh = JSON.parse(JSON.stringify(mesh))
    const loop = previewLoop
    if (!loop.length) return

    // Step 1: Split all loop edges and collect new vertices
    const newVertices = splitEdgeLoop(meshCopy, loop, 0.5)
    const edgeToNewVertex: Record<string, string> = {}
    for (let i = 0; i < loop.length; i++) {
      edgeToNewVertex[loop[i]] = newVertices[i]
    }

    // Step 2: For each face, collect new vertices on its boundary
    const faceToNewVertices: Record<string, string[]> = {}
    for (let i = 0; i < loop.length; i++) {
      const edgeId = loop[i]
      const he = meshCopy.halfEdges[edgeId]
      if (!he) continue
      const faceId = he.face
      if (!faceToNewVertices[faceId]) faceToNewVertices[faceId] = []
      faceToNewVertices[faceId].push(newVertices[i])
    }

    // Step 3: For each face, split between every consecutive pair of new vertices
    for (const originalFaceId in faceToNewVertices) {
      const verts = faceToNewVertices[originalFaceId]
      if (verts.length < 2) continue
      let currentFaceId = originalFaceId
      // Split between each consecutive pair
      for (let i = 0; i < verts.length - 1; i++) {
        const vA = verts[i]
        const vB = verts[i + 1]
        splitFace(meshCopy, currentFaceId, vA, vB)
        // After split, update currentFaceId to the face containing vA but not vB
        const newFaceId = Object.keys(meshCopy.faces).find(fid => {
          const face = meshCopy.faces[fid]
          let foundA = false, foundB = false
          let heId = face.halfEdge
          do {
            const he = meshCopy.halfEdges[heId]
            if (he.vertex === vA) foundA = true
            if (he.vertex === vB) foundB = true
            heId = he.next
          } while (heId !== face.halfEdge)
          return foundA && !foundB
        })
        if (newFaceId) currentFaceId = newFaceId
      }
      // Final split to close the loop (between last and first new vertex)
      const vA = verts[verts.length - 1]
      const vB = verts[0]
      splitFace(meshCopy, currentFaceId, vA, vB)
    }

    // Step 4: (Optional) Clean up obsolete data if needed (not implemented here)

    setScene({
      ...scene,
      meshes: {
        ...scene.meshes,
        [meshCopy.id]: meshCopy,
      },
    })
    setHoveredEdge(null)
    setPreviewLoop([])
  }

  function getUniqueEdges(mesh: HEMesh) {
    const edgeSet = new Set<string>()
    const edgeList: { id: string, v1: string, v2: string }[] = []
    for (const he of Object.values(mesh.halfEdges)) {
      const vA = mesh.halfEdges[he.id].vertex
      const vB = mesh.halfEdges[he.pair!]?.vertex
      if (!vB) continue
      const key = [vA, vB].sort().join('-')
      if (!edgeSet.has(key)) {
        edgeSet.add(key)
        edgeList.push({ id: he.id, v1: vA, v2: vB })
      }
    }
    return edgeList
  }

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {getUniqueEdges(mesh).map((e) => {
        const isHovered = hoveredEdge === e.id
        const inPreview = previewLoop.includes(e.id)
        return (
          <Line
            key={e.id}
            renderOrder={100000}
            points={[
              mesh.vertices[e.v1].position as [number, number, number],
              mesh.vertices[e.v2].position as [number, number, number],
            ]}
            color={inPreview ? '#22d3ee' : isHovered ? '#f97316' : '#888888'}
            lineWidth={inPreview ? 6 : 3}
            dashed={false}
            onPointerOver={() => handlePointerOver(e.id)}
            onPointerOut={handlePointerOut}
            onClick={(evt) => {
              evt.stopPropagation()
              if (inPreview) handleClick()
            }}
          />
        )
      })}
      {previewLoop.length > 0 && (
        <>
          {previewLoop.map((eid, i) => {
            const he = mesh.halfEdges[eid]
            const v1 = mesh.vertices[he.vertex].position as [number, number, number]
            const v2 = mesh.vertices[mesh.halfEdges[he.prev].vertex].position as [number, number, number]
            const mid: [number, number, number] = [
              (v1[0] + v2[0]) / 2,
              (v1[1] + v2[1]) / 2,
              (v1[2] + v2[2]) / 2,
            ]
            const nextEid = previewLoop[(i + 1) % previewLoop.length]
            const nextHe = mesh.halfEdges[nextEid]
            const v1b = mesh.vertices[nextHe.vertex].position as [number, number, number]
            const v2b = mesh.vertices[mesh.halfEdges[nextHe.prev].vertex].position as [number, number, number]
            const midB: [number, number, number] = [
              (v1b[0] + v2b[0]) / 2,
              (v1b[1] + v2b[1]) / 2,
              (v1b[2] + v2b[2]) / 2,
            ]
            return (
              <Line
                key={eid + '-cut'}
                points={[mid, midB]}
                color="#22d3ee"
                lineWidth={4}
                dashed
              />
            )
          })}
        </>
      )}
    </group>
  )
} 