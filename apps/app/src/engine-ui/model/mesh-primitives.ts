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
) {
  const face = mesh.faces[faceId];
  if (!face) throw new Error(`Face ${faceId} not found`);

  // Find half-edges incident to vA and vB
  let heA: HalfEdge | null = null;
  let heB: HalfEdge | null = null;
  let heId = face.halfEdge;
  do {
    const he = mesh.halfEdges[heId];
    if (he.vertex === vA) heA = he;
    if (he.vertex === vB) heB = he;
    heId = he.next;
  } while (heId !== face.halfEdge && (!heA || !heB));

  if (!heA || !heB)
    throw new Error(`Vertices ${vA} or ${vB} not found in face ${faceId}`);

  // Create new face and half-edges
  const newFaceId = uuidv4();
  const newHe1Id = uuidv4(); // vA -> vB
  const newHe2Id = uuidv4(); // vB -> vA
  const newHe1: HalfEdge = {
    id: newHe1Id,
    vertex: vB,
    pair: newHe2Id,
    face: faceId,
    next: heB.id,
    prev: heA.prev,
  };
  const newHe2: HalfEdge = {
    id: newHe2Id,
    vertex: vA,
    pair: newHe1Id,
    face: newFaceId,
    next: heA.id,
    prev: heB.prev,
  };

  // Update existing half-edges
  mesh.halfEdges[heA.prev].next = newHe1Id;
  mesh.halfEdges[heB.prev].next = newHe2Id;
  heA.prev = newHe2Id;
  heB.prev = newHe1Id;

  // Create new face
  mesh.faces[newFaceId] = { id: newFaceId, halfEdge: newHe2Id };
  mesh.halfEdges[newHe1Id] = newHe1;
  mesh.halfEdges[newHe2Id] = newHe2;

  // Reassign face for half-edges in new face
  let currentHeId = newHe2Id;
  do {
    const he = mesh.halfEdges[currentHeId];
    he.face = newFaceId;
    currentHeId = he.next;
  } while (currentHeId !== newHe2Id);
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
