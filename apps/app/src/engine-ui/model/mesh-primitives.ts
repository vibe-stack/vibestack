import { HEMesh, HalfEdge } from "./mesh";
import { v4 as uuidv4 } from "uuid";

export function splitEdge(mesh: HEMesh, edgeId: string, t: number): string {
  const he = mesh.halfEdges[edgeId];
  if (!he) throw new Error(`Half-edge ${edgeId} not found`);
  const v1 = mesh.vertices[he.vertex];
  const v2 = mesh.vertices[mesh.halfEdges[he.prev].vertex];
  if (!v1 || !v2) throw new Error(`Vertices not found for edge ${edgeId}`);

  // Create new vertex
  const newVertexId = uuidv4();
  const pos1 = v1.position;
  const pos2 = v2.position;
  const newPos: [number, number, number] = [
    pos1[0] + t * (pos2[0] - pos1[0]),
    pos1[1] + t * (pos2[1] - pos1[1]),
    pos1[2] + t * (pos2[2] - pos1[2]),
  ];
  mesh.vertices[newVertexId] = {
    id: newVertexId,
    position: newPos,
    halfEdge: null,
  };

  // Create new half-edges
  const newHeId1 = uuidv4();
  const newHeId2 = uuidv4();
  const newHe1: HalfEdge = {
    id: newHeId1,
    vertex: he.vertex,
    pair: newHeId2,
    face: he.face,
    next: he.next,
    prev: edgeId,
  };
  const newHe2: HalfEdge = {
    id: newHeId2,
    vertex: newVertexId,
    pair: newHeId1,
    face: he.face,
    next: edgeId,
    prev: he.prev,
  };

  // Update existing half-edges
  if (!mesh.halfEdges[he.next]) {
    throw new Error(`splitEdge: mesh.halfEdges[he.next] is undefined for edge ${edgeId}`)
  }
  if (!mesh.halfEdges[he.prev]) {
    throw new Error(`splitEdge: mesh.halfEdges[he.prev] is undefined for edge ${edgeId}`)
  }
  he.vertex = newVertexId;
  he.prev = newHeId1;
  mesh.halfEdges[he.next].prev = newHeId1;
  mesh.halfEdges[he.prev].next = newHeId2;

  // Add new half-edges
  mesh.halfEdges[newHeId1] = newHe1;
  mesh.halfEdges[newHeId2] = newHe2;

  // Update vertex half-edge
  mesh.vertices[newVertexId].halfEdge = newHeId2;

  // Handle pair if exists
  if (he.pair) {
    const pairHe = mesh.halfEdges[he.pair];
    const newPairHeId1 = uuidv4();
    const newPairHeId2 = uuidv4();
    const newPairHe1: HalfEdge = {
      id: newPairHeId1,
      vertex: pairHe.vertex,
      pair: newHeId2,
      face: pairHe.face,
      next: pairHe.next,
      prev: he.pair,
    };
    const newPairHe2: HalfEdge = {
      id: newPairHeId2,
      vertex: newVertexId,
      pair: newHeId1,
      face: pairHe.face,
      next: he.pair,
      prev: pairHe.prev,
    };
    pairHe.vertex = newVertexId;
    pairHe.prev = newPairHeId1;
    mesh.halfEdges[pairHe.next].prev = newPairHeId1;
    mesh.halfEdges[pairHe.prev].next = newPairHeId2;
    mesh.halfEdges[newHeId1].pair = newPairHeId2;
    mesh.halfEdges[newHeId2].pair = newPairHeId1;
    mesh.halfEdges[newPairHeId1] = newPairHe1;
    mesh.halfEdges[newPairHeId2] = newPairHe2;
  }

  return newVertexId;
}

export function splitFace(
  mesh: HEMesh,
  faceId: string,
  vA: string,
  vB: string
): [string, string] {
  const face = mesh.faces[faceId];
  if (!face) throw new Error(`Face ${faceId} not found`);

  // Find half-edges incident to vA and vB
  let heA: HalfEdge | null = null;
  let heB: HalfEdge | null = null;
  let heId = face.halfEdge;
  const visited = new Set<string>();
  do {
    if (visited.has(heId)) throw new Error(`Invalid half-edge cycle in face ${faceId}`);
    visited.add(heId);
    const he = mesh.halfEdges[heId];
    if (!he) throw new Error(`Half-edge ${heId} not found`);
    if (he.vertex === vA) heA = he;
    if (he.vertex === vB) heB = he;
    heId = he.next;
  } while (heId !== face.halfEdge && visited.size < 1000); // Prevent infinite loops

  if (!heA || !heB) throw new Error(`Vertices ${vA} or ${vB} not found in face ${faceId}`);
  if (heA.next === heB.id || heB.next === heA.id)
    throw new Error(`Vertices ${vA} and ${vB} are adjacent; cannot split`);

  // Create new face and half-edges
  const newFaceId = uuidv4();
  const newHe1Id = uuidv4(); // vA -> vB
  const newHe2Id = uuidv4(); // vB -> vA

  // New half-edges
  const newHe1: HalfEdge = {
    id: newHe1Id,
    vertex: vB,
    pair: newHe2Id,
    face: faceId,
    next: heB.id,
    prev: heA.id, // Connects to heA
  };
  const newHe2: HalfEdge = {
    id: newHe2Id,
    vertex: vA,
    pair: newHe1Id,
    face: newFaceId,
    next: heA.next, // Follows heA's path
    prev: heB.id, // Connects to heB
  };

  // Update existing half-edges
  const heANext = mesh.halfEdges[heA.next];
  const heBNext = mesh.halfEdges[heB.next];
  mesh.halfEdges[heA.next].prev = newHe2Id;
  mesh.halfEdges[heB.next].prev = newHe1Id;
  heA.next = newHe1Id;
  heB.next = newHe2Id;

  // Update prev/next for the cycles
  mesh.halfEdges[newHe1.prev] = heA;
  mesh.halfEdges[newHe2.prev] = heB;
  mesh.halfEdges[newHe1.next] = heB;
  mesh.halfEdges[newHe2.next] = heANext;

  // Create new face
  mesh.faces[newFaceId] = { id: newFaceId, halfEdge: newHe2Id };
  mesh.faces[faceId].halfEdge = newHe1Id; // Update original face
  mesh.halfEdges[newHe1Id] = newHe1;
  mesh.halfEdges[newHe2Id] = newHe2;

  // Reassign face for half-edges in new face (from vB to vA)
  let currentHeId = newHe2Id;
  const newFaceHeIds = new Set<string>();
  do {
    if (newFaceHeIds.has(currentHeId))
      throw new Error(`Invalid half-edge cycle in new face ${newFaceId}`);
    newFaceHeIds.add(currentHeId);
    const he = mesh.halfEdges[currentHeId];
    he.face = newFaceId;
    currentHeId = he.next;
  } while (currentHeId !== newHe2Id && newFaceHeIds.size < 1000);

  // Validate original face cycle
  currentHeId = newHe1Id;
  const origFaceHeIds = new Set<string>();
  do {
    if (origFaceHeIds.has(currentHeId))
      throw new Error(`Invalid half-edge cycle in face ${faceId}`);
    origFaceHeIds.add(currentHeId);
    const he = mesh.halfEdges[currentHeId];
    currentHeId = he.next;
  } while (currentHeId !== newHe1Id && origFaceHeIds.size < 1000);

  // Optional: Update vertex-to-half-edge pointers
  if (mesh.vertices) {
    mesh.vertices[vA].halfEdge = newHe2Id;
    mesh.vertices[vB].halfEdge = newHe1Id;
  }

  return [newHe1Id, newHe2Id];
}

export function splitEdgeLoop(mesh: HEMesh, edgeIds: string[], t: number): string[] {
  // 1. Collect all necessary data before mutating the mesh
  type EdgeData = {
    edgeId: string
    next: string
    prev: string
    pair: string | null
    face: string
    vertex: string
    pairNext: string | null
    pairPrev: string | null
    pairFace: string | null
    pairVertex: string | null
  }
  const edgeDataList: EdgeData[] = []
  for (const edgeId of edgeIds) {
    const he = mesh.halfEdges[edgeId]
    if (!he) throw new Error(`Half-edge ${edgeId} not found`)
    const pairHe = he.pair ? mesh.halfEdges[he.pair] : null
    edgeDataList.push({
      edgeId,
      next: he.next,
      prev: he.prev,
      pair: he.pair,
      face: he.face,
      vertex: he.vertex,
      pairNext: pairHe ? pairHe.next : null,
      pairPrev: pairHe ? pairHe.prev : null,
      pairFace: pairHe ? pairHe.face : null,
      pairVertex: pairHe ? pairHe.vertex : null,
    })
  }
  // 2. Compute all new vertex positions
  const newVertexIds: string[] = []
  const newVertices: { id: string, position: [number, number, number] }[] = []
  for (const data of edgeDataList) {
    const v1 = mesh.vertices[data.vertex]
    const v2 = mesh.vertices[mesh.halfEdges[data.prev].vertex]
    if (!v1 || !v2) throw new Error(`Vertices not found for edge ${data.edgeId}`)
    const newVertexId = uuidv4()
    const pos1 = v1.position
    const pos2 = v2.position
    const newPos: [number, number, number] = [
      pos1[0] + t * (pos2[0] - pos1[0]),
      pos1[1] + t * (pos2[1] - pos1[1]),
      pos1[2] + t * (pos2[2] - pos1[2]),
    ]
    newVertexIds.push(newVertexId)
    newVertices.push({ id: newVertexId, position: newPos })
  }
  // 3. Add all new vertices to the mesh
  for (const v of newVertices) {
    mesh.vertices[v.id] = { id: v.id, position: v.position, halfEdge: null }
  }
  // 4. For each edge, perform the split using only the collected data
  for (let i = 0; i < edgeDataList.length; i++) {
    const data = edgeDataList[i]
    const newVertexId = newVertexIds[i]
    // Create two new half-edges to split the original edge
    const newHeId1 = uuidv4()
    const newHeId2 = uuidv4()
    const newHe1: HalfEdge = {
      id: newHeId1,
      vertex: data.vertex,
      pair: newHeId2,
      face: data.face,
      next: data.next,
      prev: data.edgeId,
    }
    const newHe2: HalfEdge = {
      id: newHeId2,
      vertex: newVertexId,
      pair: newHeId1,
      face: data.face,
      next: data.edgeId,
      prev: data.prev,
    }
    // Update the original half-edge
    const he = mesh.halfEdges[data.edgeId]
    he.vertex = newVertexId
    he.prev = newHeId1
    mesh.halfEdges[data.next].prev = newHeId1
    mesh.halfEdges[data.prev].next = newHeId2
    // Add new half-edges
    mesh.halfEdges[newHeId1] = newHe1
    mesh.halfEdges[newHeId2] = newHe2
    // Update vertex half-edge
    mesh.vertices[newVertexId].halfEdge = newHeId2
    // Handle pair if exists
    if (data.pair) {
      const newPairHeId1 = uuidv4()
      const newPairHeId2 = uuidv4()
      const newPairHe1: HalfEdge = {
        id: newPairHeId1,
        vertex: data.pairVertex!,
        pair: newHeId2,
        face: data.pairFace!,
        next: data.pairNext!,
        prev: data.pair,
      }
      const newPairHe2: HalfEdge = {
        id: newPairHeId2,
        vertex: newVertexId,
        pair: newHeId1,
        face: data.pairFace!,
        next: data.pair,
        prev: data.pairPrev!,
      }
      const pairHe = mesh.halfEdges[data.pair]
      pairHe.vertex = newVertexId
      pairHe.prev = newPairHeId1
      mesh.halfEdges[data.pairNext!].prev = newPairHeId1
      mesh.halfEdges[data.pairPrev!].next = newPairHeId2
      mesh.halfEdges[newHeId1].pair = newPairHeId2
      mesh.halfEdges[newHeId2].pair = newPairHeId1
      mesh.halfEdges[newPairHeId1] = newPairHe1
      mesh.halfEdges[newPairHeId2] = newPairHe2
    }
  }
  return newVertexIds
}

// Splits a face along a sequence of vertices (verts must be in order on the face boundary)
export function splitFaceAlongVertices(mesh: HEMesh, faceId: string, verts: string[]) {
  if (verts.length < 2) return
  const face = mesh.faces[faceId]
  if (!face) throw new Error(`Face ${faceId} not found`)

  // Find the half-edges in the face that are incident to each vertex in verts
  const heIds: string[] = []
  let heId = face.halfEdge
  do {
    const he = mesh.halfEdges[heId]
    if (verts.includes(he.vertex)) heIds.push(he.id)
    heId = he.next
  } while (heId !== face.halfEdge && heIds.length < verts.length)
  if (heIds.length !== verts.length) throw new Error('Not all verts found on face boundary')

  // Create new face
  const newFaceId = uuidv4()
  // Create new half-edges for the cut
  const newHeIds: string[] = []
  for (let i = 0; i < verts.length; i++) {
    const vA = verts[i]
    const vB = verts[(i + 1) % verts.length]
    const heIdA = uuidv4()
    const heIdB = uuidv4()
    // heIdA: vA->vB (in original face)
    // heIdB: vB->vA (in new face)
    mesh.halfEdges[heIdA] = {
      id: heIdA,
      vertex: vB,
      pair: heIdB,
      face: faceId,
      next: '',
      prev: '',
    }
    mesh.halfEdges[heIdB] = {
      id: heIdB,
      vertex: vA,
      pair: heIdA,
      face: newFaceId,
      next: '',
      prev: '',
    }
    newHeIds.push(heIdA)
  }
  // Link the new half-edges in a loop
  for (let i = 0; i < newHeIds.length; i++) {
    const curr = mesh.halfEdges[newHeIds[i]]
    const next = mesh.halfEdges[newHeIds[(i + 1) % newHeIds.length]]
    curr.next = next.id
    next.prev = curr.id
  }
  // Insert the new half-edges into the original face boundary
  // For each pair (heIds[i], newHeIds[i]), update pointers
  for (let i = 0; i < verts.length; i++) {
    const origHe = mesh.halfEdges[heIds[i]]
    const cutHe = mesh.halfEdges[newHeIds[i]]
    // Save old next
    const oldNext = origHe.next
    origHe.next = cutHe.id
    cutHe.prev = origHe.id
    // The cut half-edge's next should be the next original half-edge
    cutHe.next = oldNext
    mesh.halfEdges[oldNext].prev = cutHe.id
  }
  // Set face pointers
  mesh.faces[newFaceId] = { id: newFaceId, halfEdge: mesh.halfEdges[newHeIds[0]].pair! }
  // Update face for all half-edges in the new face
  let currHeId = mesh.faces[newFaceId].halfEdge
  do {
    mesh.halfEdges[currHeId].face = newFaceId
    currHeId = mesh.halfEdges[currHeId].next
  } while (currHeId !== mesh.faces[newFaceId].halfEdge)
}

export function splitFacePolygon(mesh: HEMesh, faceId: string, verts: string[]): [string, string][] {
  if (verts.length < 2) {
    console.warn("splitFacePolygon: Need at least 2 vertices to split");
    return [];
  }

  const face = mesh.faces[faceId];
  if (!face) throw new Error(`Face ${faceId} not found`);

  // Step 1: Find half-edges incident to each vertex in verts
  const heIds: string[] = [];
  let heId = face.halfEdge;
  const visited = new Set<string>();
  let iterationCount = 0;
  const maxIterations = 10000; // Prevent infinite loops

  // Create a vertex-to-half-edge map for faster lookup
  const vertToHe: { [vertex: string]: string } = {};
  do {
    const he = mesh.halfEdges[heId];
    if (!he) throw new Error(`Half-edge ${heId} not found`);
    vertToHe[he.vertex] = he.id;
    heId = he.next;
    if (visited.has(heId)) throw new Error("Cycle detected in half-edge loop");
    visited.add(heId);
    iterationCount++;
    if (iterationCount > maxIterations) throw new Error("Max iterations exceeded in half-edge loop");
  } while (heId !== face.halfEdge);

  // Collect half-edges for the provided vertices
  for (const v of verts) {
    const he = vertToHe[v];
    if (!he) throw new Error(`Vertex ${v} not found on face ${faceId} boundary`);
    heIds.push(he);
  }

  if (heIds.length !== verts.length) {
    throw new Error(`Expected ${verts.length} vertices, found ${heIds.length}`);
  }

  // Step 2: Create new face and half-edges for the cut
  const newFaceId = uuidv4();
  const newHeIds: { id: string; vertex: string; pair: string; face: string }[] = [];
  const pairs: [string, string][] = [];

  // For a polygon with N verts, create N cut edges (each with a pair)
  for (let i = 0; i < verts.length; i++) {
    const vA = verts[i];
    const vB = verts[(i + 1) % verts.length];
    const heIdA = uuidv4(); // vA -> vB (original face)
    const heIdB = uuidv4(); // vB -> vA (new face)
    newHeIds.push(
      { id: heIdA, vertex: vB, pair: heIdB, face: faceId },
      { id: heIdB, vertex: vA, pair: heIdA, face: newFaceId }
    );
    pairs.push([heIdA, heIdB]);
  }

  // Step 3: Link new half-edges in a loop for both faces
  const halfEdges = newHeIds.map((he) => ({
    id: he.id,
    vertex: he.vertex,
    pair: he.pair,
    face: he.face,
    next: '',
    prev: '',
  }));

  // Link the cut edges for the original face (even indices)
  for (let i = 0; i < verts.length; i++) {
    const curr = halfEdges[i * 2];
    const next = halfEdges[((i + 1) % verts.length) * 2];
    curr.next = next.id;
    next.prev = curr.id;
  }
  // Link the cut edges for the new face (odd indices)
  for (let i = 0; i < verts.length; i++) {
    const curr = halfEdges[i * 2 + 1];
    const next = halfEdges[((i + 1) % verts.length) * 2 + 1];
    curr.next = next.id;
    next.prev = curr.id;
  }

  // Step 4: Insert new half-edges into the original face boundary
  for (let i = 0; i < verts.length; i++) {
    const origHe = mesh.halfEdges[heIds[i]];
    const cutHe = halfEdges[i * 2]; // vA -> vB
    const oldNext = origHe.next;
    origHe.next = cutHe.id;
    cutHe.prev = origHe.id;
    cutHe.next = oldNext;
    mesh.halfEdges[oldNext].prev = cutHe.id;
  }

  // Step 5: Add new half-edges to the mesh
  for (const he of halfEdges) {
    mesh.halfEdges[he.id] = he;
  }

  // Step 6: Create new face and update face pointers
  mesh.faces[newFaceId] = { id: newFaceId, halfEdge: halfEdges[1].id };
  let currHeId = halfEdges[1].id;
  visited.clear();
  iterationCount = 0;
  do {
    const currHe = mesh.halfEdges[currHeId];
    if (!currHe) throw new Error(`Half-edge ${currHeId} not found`);
    currHe.face = newFaceId;
    currHeId = currHe.next;
    if (visited.has(currHeId)) throw new Error("Cycle detected in new face loop");
    visited.add(currHeId);
    iterationCount++;
    if (iterationCount > maxIterations) throw new Error("Max iterations exceeded in new face loop");
  } while (currHeId !== halfEdges[1].id);

  return pairs;
}

export function repairFaces(mesh: HEMesh) {
  const validFaces: Record<string, boolean> = {};
  // First, mark all faces as valid if their halfEdge exists and forms a loop
  for (const faceId in mesh.faces) {
    const face = mesh.faces[faceId];
    const startHeId = face.halfEdge;
    let heId = startHeId;
    const seen = new Set<string>();
    let valid = true;
    for (let i = 0; i < 10000; i++) {
      const he = mesh.halfEdges[heId];
      if (!he || he.face !== faceId) {
        valid = false;
        break;
      }
      if (seen.has(heId)) {
        if (heId !== startHeId) valid = false;
        break;
      }
      seen.add(heId);
      heId = he.next;
    }
    if (valid && seen.size >= 3) {
      validFaces[faceId] = true;
      // Set face property on all boundary half-edges
      for (const heId of seen) {
        mesh.halfEdges[heId].face = faceId;
      }
      // Ensure face.halfEdge is valid
      face.halfEdge = startHeId;
    } else {
      validFaces[faceId] = false;
    }
  }
  // Remove invalid faces
  for (const faceId in mesh.faces) {
    if (!validFaces[faceId]) {
      delete mesh.faces[faceId];
    }
  }
}