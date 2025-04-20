import type { HEMesh } from "@/engine-ui/model/mesh";
type Loop = {
  faceId: string;
  vertexId: string;
  edgeId: string;
  next?: Loop;
  prev?: Loop;
};

// Builds vertex-to-edge mappings for pole detection
function buildVertexToEdges(mesh: HEMesh): Record<string, string[]> {
  const vertexToEdges: Record<string, string[]> = {};
  for (const vertexId in mesh.vertices) {
    vertexToEdges[vertexId] = [];
  }
  for (const he of Object.values(mesh.halfEdges)) {
    vertexToEdges[he.vertex].push(he.id);
  }
  return vertexToEdges;
}

// Builds loop structures for each face
function buildLoopStructures(mesh: HEMesh): Record<string, Loop[]> {
  const faceToLoops: Record<string, Loop[]> = {};
  for (const face of Object.values(mesh.faces)) {
    const loops: Loop[] = [];
    let heId = face.halfEdge;
    const startHeId = heId;
    if (!(heId in mesh.halfEdges)) {
      console.warn(`Skipping face ${face.id}: Invalid half-edge ${heId}`);
      continue;
    }
    do {
      const he = mesh.halfEdges[heId];
      loops.push({
        faceId: face.id,
        vertexId: he.vertex,
        edgeId: heId,
      });
      heId = he.next;
    } while (heId !== startHeId && heId in mesh.halfEdges);
    if (heId !== startHeId) {
      console.warn(`Face ${face.id} is not closed`);
      continue;
    }
    const n = loops.length;
    for (let i = 0; i < n; i++) {
      loops[i].next = loops[(i + 1) % n];
      loops[i].prev = loops[(i + n - 1) % n];
    }
    faceToLoops[face.id] = loops;
  }
  return faceToLoops;
}

// Computes the direction vector of a half-edge
function getEdgeDirection(mesh: HEMesh, heId: string): [number, number, number] {
  const he = mesh.halfEdges[heId];
  const v1 = mesh.vertices[he.vertex].position;
  const nextHe = mesh.halfEdges[he.next];
  const v2 = mesh.vertices[nextHe.vertex].position;
  return [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
}

// Dot product for direction comparison
function dotProduct(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

// Finds the opposite edge in a quad face by vertex connectivity
function findOppositeEdgeInQuad(currentLoop: Loop, faceLoops: Loop[], mesh: HEMesh): Loop | undefined {
  // Get the current half-edge and its vertices
  const currentHe = mesh.halfEdges[currentLoop.edgeId];
  const v1 = currentHe.vertex; // Start vertex of the edge
  const v2 = mesh.halfEdges[currentHe.next].vertex; // End vertex of the edge

  // Find the face's vertices in order
  const faceVertices = faceLoops.map((loop) => mesh.halfEdges[loop.edgeId].vertex);
  const currentIndex = faceVertices.indexOf(v1);
  if (currentIndex === -1) return undefined;

  // In a quad, the opposite edge connects the two vertices not part of the current edge
  const faceVertexCount = faceLoops.length;
  const otherVertices = faceVertices
    .slice(currentIndex, currentIndex + faceVertexCount)
    .concat(faceVertices.slice(0, currentIndex))
    .slice(1, 3); // Vertices after v1, excluding v2

  // Find the edge connecting otherVertices[0] and otherVertices[1]
  for (const loop of faceLoops) {
    const he = mesh.halfEdges[loop.edgeId];
    const heV1 = he.vertex;
    const heV2 = mesh.halfEdges[he.next].vertex;
    if (
      (heV1 === otherVertices[0] && heV2 === otherVertices[1]) ||
      (heV1 === otherVertices[1] && heV2 === otherVertices[0])
    ) {
      return loop;
    }
  }

  return undefined;
}

// Finds a single edge loop starting from a half-edge
function findEdgeLoop(
  startEdgeId: string,
  mesh: HEMesh,
  faceToLoops: Record<string, Loop[]>,
  vertexToEdges: Record<string, string[]>,
  directionHint: [number, number, number] = [0, 0, 0],
  maxEdges: number = 1000,
  debug: boolean = false
): string[] {
  const loopEdges: string[] = [];
  let currentHeId = startEdgeId;
  const visited = new Set<string>();
  let isClosed = false;

  while (loopEdges.length < maxEdges) {
    if (!(currentHeId in mesh.halfEdges)) {
      if (debug) console.log(`Terminated: Invalid half-edge ${currentHeId}`);
      break;
    }
    if (visited.has(currentHeId)) {
      isClosed = currentHeId === startEdgeId;
      if (debug) console.log(`Terminated: Cycle detected, closed=${isClosed}`);
      break;
    }
    visited.add(currentHeId);

    const he = mesh.halfEdges[currentHeId];
    loopEdges.push(he.id);
    const v1 = he.vertex;
    const v2 = mesh.halfEdges[he.next].vertex;
    if (debug) console.log(`Added edge ${he.id} (face ${he.face}, vertices ${v1} -> ${v2})`);

    // Check for boundary
    if (!he.pair || !(he.pair in mesh.halfEdges)) {
      if (debug) console.log(`Terminated: Boundary at ${currentHeId} (no pair)`);
      break;
    }

    // Get the adjacent face via the paired half-edge
    const nextHe = mesh.halfEdges[he.pair];
    const faceId = nextHe.face;
    const faceLoops = faceToLoops[faceId];
    if (!faceLoops || faceLoops.length === 0) {
      if (debug) console.log(`Terminated: No face loops for face ${faceId}`);
      break;
    }

    // Find the current loop in the face
    const currentLoop = faceLoops.find((l) => l.edgeId === he.pair);
    if (!currentLoop) {
      if (debug) console.log(`Terminated: No loop for edge ${he.pair} in face ${faceId}`);
      break;
    }
    if (debug) console.log(`Found current loop for edge ${he.pair} in face ${faceId}`);

    // Select the opposite edge
    let oppositeLoop: Loop | undefined;
    const faceVertexCount = faceLoops.length;
    if (faceVertexCount === 4) {
      oppositeLoop = findOppositeEdgeInQuad(currentLoop, faceLoops, mesh);
    } else if (faceVertexCount === 3) {
      oppositeLoop = currentLoop.next;
    } else {
      const candidates = faceLoops.filter((l) => l !== currentLoop && l !== currentLoop.prev);
      oppositeLoop = candidates.reduce((best, loop) => {
        const dir = getEdgeDirection(mesh, loop.edgeId);
        const dotBest = best ? dotProduct(dir, directionHint) : -Infinity;
        const dotCurrent = dotProduct(dir, directionHint);
        return dotCurrent > dotBest ? loop : best;
      }, undefined as Loop | undefined);
    }

    if (!oppositeLoop) {
      if (debug) console.log(`Terminated: No opposite loop in face ${faceId}`);
      break;
    }
    const oppHe = mesh.halfEdges[oppositeLoop.edgeId];
    const oppV1 = oppHe.vertex;
    const oppV2 = mesh.halfEdges[oppHe.next].vertex;
    if (debug) console.log(`Selected opposite edge ${oppositeLoop.edgeId} (vertices ${oppV1} -> ${oppV2})`);

    // Move to the paired half-edge of the opposite edge
    const oppositeHeId = oppositeLoop.edgeId;
    const oppositeHe = mesh.halfEdges[oppositeHeId];
    if (!oppositeHe.pair || !(oppositeHe.pair in mesh.halfEdges)) {
      if (debug) console.log(`Terminated: No pair for opposite edge ${oppositeHeId}`);
      break;
    }

    currentHeId = oppositeHe.pair;
    if (debug) console.log(`Moving to next half-edge ${currentHeId} (face ${mesh.halfEdges[currentHeId].face})`);
  }

  if (loopEdges.length > 0 && (isClosed || loopEdges.length < maxEdges)) {
    if (debug) console.log(`Valid loop: ${loopEdges.length} edges, closed=${isClosed}`);
    return loopEdges;
  }
  if (debug) console.log(`Invalid loop: ${loopEdges.length} edges`);
  return [];
}

// Finds all edge loops in the mesh
export function findMeshLoops(
  mesh: HEMesh,
  directionHint: [number, number, number] = [0, 0, 0],
  maxEdges: number = 1000,
  debug: boolean = false
): string[][] {
  const faceToLoops = buildLoopStructures(mesh);
  const loops: string[][] = [];
  const visitedHalfEdges = new Set<string>();
  const vertexToEdges = buildVertexToEdges(mesh);

  for (const heId in mesh.halfEdges) {
    if (visitedHalfEdges.has(heId)) continue;

    const loop = findEdgeLoop(heId, mesh, faceToLoops, vertexToEdges, directionHint, maxEdges, debug);
    if (loop.length > 0) {
      loops.push(loop);
      for (const edgeId of loop) {
        visitedHalfEdges.add(edgeId);
        const he = mesh.halfEdges[edgeId];
        if (he.pair) visitedHalfEdges.add(he.pair);
      }
    }
  }

  return loops;
}