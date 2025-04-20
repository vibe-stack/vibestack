import { HEMesh } from '../../../model/mesh'

export type Mesh = {
  vertices: Record<string, { id: string; position: [number, number, number] }>;
  edges: Record<string, { id: string; v1: string; v2: string }>;
  faces: Record<string, { id: string; vertices: string[] }>;
};

type Loop = {
  faceId: string;
  vertexId: string;
  edgeId: string;
  next?: Loop;
  prev?: Loop;
  radialNext?: Loop;
};

function buildLoopStructures(mesh: HEMesh): Record<string, Loop[]> {
  const faceToLoops: Record<string, Loop[]> = {};
  for (const face of Object.values(mesh.faces)) {
    const loops: Loop[] = [];
    // Traverse the face's half-edges
    const startHeId = face.halfEdge;
    let heId = startHeId;
    do {
      const he = mesh.halfEdges[heId];
      loops.push({
        faceId: face.id,
        vertexId: he.vertex,
        edgeId: he.id,
      });
      heId = he.next;
    } while (heId !== startHeId);
    // Link next/prev for n-gons
    const n = loops.length;
    for (let i = 0; i < n; i++) {
      loops[i].next = loops[(i + 1) % n];
      loops[i].prev = loops[(i + n - 1) % n];
    }
    faceToLoops[face.id] = loops;
  }
  return faceToLoops;
}

function buildEdgeToLoopsMap(mesh: HEMesh, faceToLoops: Record<string, Loop[]>): Record<string, Loop[]> {
  const edgeToLoops: Record<string, Loop[]> = {};
  for (const loops of Object.values(faceToLoops)) {
    for (const loop of loops) {
      if (!edgeToLoops[loop.edgeId]) edgeToLoops[loop.edgeId] = [];
      edgeToLoops[loop.edgeId].push(loop);
    }
  }
  return edgeToLoops;
}

function linkRadialLoops(mesh: HEMesh, edgeToLoops: Record<string, Loop[]>) {
  for (const heId in mesh.halfEdges) {
    const he = mesh.halfEdges[heId];
    if (!he.pair) continue;
    const loopsA = edgeToLoops[he.id];
    const loopsB = edgeToLoops[he.pair];
    if (loopsA && loopsB) {
      for (const loopA of loopsA) {
        for (const loopB of loopsB) {
          loopA.radialNext = loopB;
        }
      }
    }
  }
}

export function findMeshLoops(mesh: HEMesh): string[][] {
  const faceToLoops = buildLoopStructures(mesh);
  const edgeToLoops = buildEdgeToLoopsMap(mesh, faceToLoops);
  linkRadialLoops(mesh, edgeToLoops);

  const visited = new Set<string>();
  const loops: string[][] = [];

  // Find loops through manifold edges (edges shared by exactly two faces)
  for (const edgeId of Object.keys(edgeToLoops)) {
    if (visited.has(edgeId)) continue;
    const edgeLoops = edgeToLoops[edgeId];
    if (!edgeLoops || edgeLoops.length !== 2) continue; // Only manifold edges
    const startLoop = edgeLoops[0];
    let currentLoop = startLoop;
    const loopEdges: string[] = [];
    while (true) {
      if (visited.has(currentLoop.edgeId)) break;
      loopEdges.push(currentLoop.edgeId);
      visited.add(currentLoop.edgeId);
      // Determine face size
      const faceLoops = faceToLoops[currentLoop.faceId];
      let nextLoop: Loop | undefined;
      if (faceLoops.length === 4) {
        // For quads, jump across the face
        nextLoop = currentLoop.next?.next?.radialNext;
      } else {
        // For n-gons, walk to next edge
        nextLoop = currentLoop.next?.radialNext;
      }
      if (!nextLoop) break; // Boundary
      if (nextLoop === startLoop) break; // Closed loop
      currentLoop = nextLoop;
    }
    if (loopEdges.length > 1) loops.push(loopEdges);
  }

  return loops;
}