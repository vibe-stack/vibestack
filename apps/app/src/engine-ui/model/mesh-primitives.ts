import { HEMesh, HEVertex, HEFace, HalfEdge } from "./mesh";
import { v4 as uuidv4 } from "uuid";

export function createCubeMesh(): HEMesh {
  // 8 vertices of a unit cube
  const positions: [number, number, number][] = [
    [-0.5, -0.5, -0.5], // 0
    [0.5, -0.5, -0.5], // 1
    [0.5, 0.5, -0.5], // 2
    [-0.5, 0.5, -0.5], // 3
    [-0.5, -0.5, 0.5], // 4
    [0.5, -0.5, 0.5], // 5
    [0.5, 0.5, 0.5], // 6
    [-0.5, 0.5, 0.5], // 7
  ];
  const vertices: HEVertex[] = positions.map((pos) => ({
    id: uuidv4(),
    position: pos,
    halfEdge: null,
  }));

  // Each face is a quad, defined by 4 vertex indices (CCW from outside)
  const faceVerts = [
    [3, 2, 1, 0], // back (fixed: reversed to CCW)
    [4, 5, 6, 7], // front
    [0, 4, 7, 3], // left
    [2, 6, 5, 1], // right (fixed: reversed to CCW)
    [3, 7, 6, 2], // top
    [0, 1, 5, 4], // bottom
  ];

  // For each face, create 4 half-edges and 1 face
  const halfEdges: Record<string, HalfEdge> = {};
  const faces: Record<string, HEFace> = {};
  const edgeMap: Record<
    string,
    { he: HalfEdge; vStart: number; vEnd: number }
  > = {};

  // Helper to get a unique key for an edge (undirected)
  const edgeKey = (a: number, b: number) => (a < b ? `${a}_${b}` : `${b}_${a}`);

  // Create all face half-edges and faces
  faceVerts.forEach((verts) => {
    const faceId = uuidv4();
    const hes: HalfEdge[] = [];
    for (let i = 0; i < 4; i++) {
      const vStart = verts[i];
      const vEnd = verts[(i + 1) % 4];
      const he: HalfEdge = {
        id: uuidv4(),
        vertex: vertices[vEnd].id,
        pair: null,
        face: faceId,
        next: "",
        prev: "",
      };
      hes.push(he);
      // Store for pairing
      const k = edgeKey(vStart, vEnd);
      if (!edgeMap[k]) edgeMap[k] = { he, vStart, vEnd };
      else {
        // Pair with the existing half-edge
        he.pair = edgeMap[k].he.id;
        edgeMap[k].he.pair = he.id;
      }
    }
    // Link next/prev
    for (let i = 0; i < 4; i++) {
      hes[i].next = hes[(i + 1) % 4].id;
      hes[i].prev = hes[(i + 3) % 4].id;
      halfEdges[hes[i].id] = hes[i];
    }
    // Create face
    faces[faceId] = { id: faceId, halfEdge: hes[0].id };
  });

  // Assign outgoing half-edges to vertices (pick any incident half-edge)
  vertices.forEach((v) => {
    v.halfEdge =
      Object.values(halfEdges).find((he) => he.vertex === v.id)?.id || null;
  });

  return {
    id: uuidv4(),
    vertices: Object.fromEntries(vertices.map((v) => [v.id, v])),
    halfEdges,
    faces,
    modifiers: [],
  };
}

export function createPlaneMesh(): HEMesh {
  // 4 vertices of a unit quad in XY plane
  const v0: HEVertex = {
    id: uuidv4(),
    position: [-0.5, -0.5, 0],
    halfEdge: null,
  };
  const v1: HEVertex = {
    id: uuidv4(),
    position: [0.5, -0.5, 0],
    halfEdge: null,
  };
  const v2: HEVertex = {
    id: uuidv4(),
    position: [0.5, 0.5, 0],
    halfEdge: null,
  };
  const v3: HEVertex = {
    id: uuidv4(),
    position: [-0.5, 0.5, 0],
    halfEdge: null,
  };

  // 4 face half-edges (counter-clockwise)
  const he0: HalfEdge = {
    id: uuidv4(),
    vertex: v1.id,
    pair: null,
    face: "",
    next: "",
    prev: "",
  };
  const he1: HalfEdge = {
    id: uuidv4(),
    vertex: v2.id,
    pair: null,
    face: "",
    next: "",
    prev: "",
  };
  const he2: HalfEdge = {
    id: uuidv4(),
    vertex: v3.id,
    pair: null,
    face: "",
    next: "",
    prev: "",
  };
  const he3: HalfEdge = {
    id: uuidv4(),
    vertex: v0.id,
    pair: null,
    face: "",
    next: "",
    prev: "",
  };

  // Link half-edges in a loop
  he0.next = he1.id;
  he1.next = he2.id;
  he2.next = he3.id;
  he3.next = he0.id;
  he0.prev = he3.id;
  he1.prev = he0.id;
  he2.prev = he1.id;
  he3.prev = he2.id;

  // 4 outer half-edges (optional, not connected to a face)
  const ohe0: HalfEdge = {
    id: uuidv4(),
    vertex: v0.id,
    pair: he0.id,
    face: "",
    next: "",
    prev: "",
  };
  const ohe1: HalfEdge = {
    id: uuidv4(),
    vertex: v1.id,
    pair: he1.id,
    face: "",
    next: "",
    prev: "",
  };
  const ohe2: HalfEdge = {
    id: uuidv4(),
    vertex: v2.id,
    pair: he2.id,
    face: "",
    next: "",
    prev: "",
  };
  const ohe3: HalfEdge = {
    id: uuidv4(),
    vertex: v3.id,
    pair: he3.id,
    face: "",
    next: "",
    prev: "",
  };
  he0.pair = ohe0.id;
  he1.pair = ohe1.id;
  he2.pair = ohe2.id;
  he3.pair = ohe3.id;

  // 1 face
  const face: HEFace = { id: uuidv4(), halfEdge: he0.id };
  he0.face = face.id;
  he1.face = face.id;
  he2.face = face.id;
  he3.face = face.id;

  // Assign outgoing half-edges to vertices
  v0.halfEdge = he3.id;
  v1.halfEdge = he0.id;
  v2.halfEdge = he1.id;
  v3.halfEdge = he2.id;

  return {
    id: uuidv4(),
    vertices: { [v0.id]: v0, [v1.id]: v1, [v2.id]: v2, [v3.id]: v3 },
    halfEdges: {
      [he0.id]: he0,
      [he1.id]: he1,
      [he2.id]: he2,
      [he3.id]: he3,
      [ohe0.id]: ohe0,
      [ohe1.id]: ohe1,
      [ohe2.id]: ohe2,
      [ohe3.id]: ohe3,
    },
    faces: { [face.id]: face },
    modifiers: [],
  };
}

export function createSphereMesh(): HEMesh {
  const latSegments = 12;
  const lonSegments = 16;
  const vertices: HEVertex[] = [];
  const vertexGrid: string[][] = [];

  for (let lat = 0; lat <= latSegments; lat++) {
    const theta = (lat * Math.PI) / latSegments;
    const row: string[] = [];
    for (let lon = 0; lon < lonSegments; lon++) {
      const phi = (lon * 2 * Math.PI) / lonSegments;
      const x = Math.sin(theta) * Math.cos(phi) * 0.5;
      const y = Math.cos(theta) * 0.5;
      const z = Math.sin(theta) * Math.sin(phi) * 0.5;
      const v: HEVertex = { id: uuidv4(), position: [x, y, z], halfEdge: null };
      vertices.push(v);
      row.push(v.id);
    }
    vertexGrid.push(row);
  }

  const northPole: HEVertex = {
    id: uuidv4(),
    position: [0, 0.5, 0],
    halfEdge: null,
  };
  const southPole: HEVertex = {
    id: uuidv4(),
    position: [0, -0.5, 0],
    halfEdge: null,
  };
  vertices.push(northPole, southPole);

  const halfEdges: Record<string, HalfEdge> = {};
  const faces: Record<string, HEFace> = {};
  const edgeMap: Record<
    string,
    { he: HalfEdge; vStart: string; vEnd: string }
  > = {};
  const edgeKey = (a: string, b: string) => (a < b ? `${a}_${b}` : `${b}_${a}`);

  // Top cap
  for (let lon = 0; lon < lonSegments; lon++) {
    const v0 = northPole.id;
    const v1 = vertexGrid[0][lon];
    const v2 = vertexGrid[0][(lon + 1) % lonSegments];
    const faceId = uuidv4();
    const hes: HalfEdge[] = [];
    const ids = [v0, v1, v2];
    for (let i = 0; i < 3; i++) {
      const he: HalfEdge = {
        id: uuidv4(),
        vertex: ids[(i + 1) % 3],
        pair: null,
        face: faceId,
        next: "",
        prev: "",
      };
      hes.push(he);
      const k = edgeKey(ids[i], ids[(i + 1) % 3]);
      if (!edgeMap[k])
        edgeMap[k] = { he, vStart: ids[i], vEnd: ids[(i + 1) % 3] };
      else {
        he.pair = edgeMap[k].he.id;
        edgeMap[k].he.pair = he.id;
      }
    }
    for (let i = 0; i < 3; i++) {
      hes[i].next = hes[(i + 1) % 3].id;
      hes[i].prev = hes[(i + 2) % 3].id;
      halfEdges[hes[i].id] = hes[i];
    }
    faces[faceId] = { id: faceId, halfEdge: hes[0].id };
  }

  // Body
  for (let lat = 0; lat < latSegments; lat++) {
    if (lat === latSegments) continue;
    for (let lon = 0; lon < lonSegments; lon++) {
      const v00 = vertexGrid[lat][lon];
      const v01 = vertexGrid[lat][(lon + 1) % lonSegments];
      const v10 = vertexGrid[lat + 1][lon];
      const v11 = vertexGrid[lat + 1][(lon + 1) % lonSegments];
      const faceId = uuidv4();
      const quad = [v00, v01, v11, v10];
      const hes: HalfEdge[] = [];
      for (let i = 0; i < 4; i++) {
        const he: HalfEdge = {
          id: uuidv4(),
          vertex: quad[(i + 1) % 4],
          pair: null,
          face: faceId,
          next: "",
          prev: "",
        };
        hes.push(he);
        const k = edgeKey(quad[i], quad[(i + 1) % 4]);
        if (!edgeMap[k])
          edgeMap[k] = { he, vStart: quad[i], vEnd: quad[(i + 1) % 4] };
        else {
          he.pair = edgeMap[k].he.id;
          edgeMap[k].he.pair = he.id;
        }
      }
      for (let i = 0; i < 4; i++) {
        hes[i].next = hes[(i + 1) % 4].id;
        hes[i].prev = hes[(i + 3) % 4].id;
        halfEdges[hes[i].id] = hes[i];
      }
      faces[faceId] = { id: faceId, halfEdge: hes[0].id };
    }
  }

  // Bottom cap
  for (let lon = 0; lon < lonSegments; lon++) {
    const v0 = southPole.id;
    const v1 = vertexGrid[latSegments][lon];
    const v2 = vertexGrid[latSegments][(lon + 1) % lonSegments];
    const faceId = uuidv4();
    const hes: HalfEdge[] = [];
    const ids = [v0, v1, v2];
    for (let i = 0; i < 3; i++) {
      const he: HalfEdge = {
        id: uuidv4(),
        vertex: ids[(i + 1) % 3],
        pair: null,
        face: faceId,
        next: "",
        prev: "",
      };
      hes.push(he);
      const k = edgeKey(ids[i], ids[(i + 1) % 3]);
      if (!edgeMap[k])
        edgeMap[k] = { he, vStart: ids[i], vEnd: ids[(i + 1) % 3] };
      else {
        he.pair = edgeMap[k].he.id;
        edgeMap[k].he.pair = he.id;
      }
    }
    for (let i = 0; i < 3; i++) {
      hes[i].next = hes[(i + 1) % 3].id;
      hes[i].prev = hes[(i + 2) % 3].id;
      halfEdges[hes[i].id] = hes[i];
    }
    faces[faceId] = { id: faceId, halfEdge: hes[0].id };
  }

  vertices.forEach((v) => {
    v.halfEdge =
      Object.values(halfEdges).find((he) => he.vertex === v.id)?.id || null;
  });
  northPole.halfEdge =
    Object.values(halfEdges).find((he) => he.vertex === northPole.id)?.id ||
    null;
  southPole.halfEdge =
    Object.values(halfEdges).find((he) => he.vertex === southPole.id)?.id ||
    null;

  return {
    id: uuidv4(),
    vertices: Object.fromEntries(vertices.map((v) => [v.id, v])),
    halfEdges,
    faces,
    modifiers: [],
  };
}

export function createCylinderMesh(): HEMesh {
  const radialSegments = 16;
  const height = 1;
  const radius = 0.5;
  const vertices: HEVertex[] = [];
  const topVerts: string[] = [];
  const bottomVerts: string[] = [];

  // Create top and bottom circle vertices
  for (let i = 0; i < radialSegments; i++) {
    const theta = (i * 2 * Math.PI) / radialSegments;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    const top: HEVertex = {
      id: uuidv4(),
      position: [x, height / 2, z],
      halfEdge: null,
    };
    const bottom: HEVertex = {
      id: uuidv4(),
      position: [x, -height / 2, z],
      halfEdge: null,
    };
    vertices.push(top, bottom);
    topVerts.push(top.id);
    bottomVerts.push(bottom.id);
  }
  // Center vertices for caps
  const topCenter: HEVertex = {
    id: uuidv4(),
    position: [0, height / 2, 0],
    halfEdge: null,
  };
  const bottomCenter: HEVertex = {
    id: uuidv4(),
    position: [0, -height / 2, 0],
    halfEdge: null,
  };
  vertices.push(topCenter, bottomCenter);

  const halfEdges: Record<string, HalfEdge> = {};
  const faces: Record<string, HEFace> = {};
  const edgeMap: Record<
    string,
    { he: HalfEdge; vStart: string; vEnd: string }
  > = {};
  const edgeKey = (a: string, b: string) => (a < b ? `${a}_${b}` : `${b}_${a}`);

  // Side faces (quads)
  for (let i = 0; i < radialSegments; i++) {
    const next = (i + 1) % radialSegments;
    const v00 = topVerts[i];
    const v01 = topVerts[next];
    const v11 = bottomVerts[next];
    const v10 = bottomVerts[i];
    const faceId = uuidv4();
    const quad = [v00, v01, v11, v10];
    const hes: HalfEdge[] = [];
    for (let j = 0; j < 4; j++) {
      const he: HalfEdge = {
        id: uuidv4(),
        vertex: quad[(j + 1) % 4],
        pair: null,
        face: faceId,
        next: "",
        prev: "",
      };
      hes.push(he);
      const k = edgeKey(quad[j], quad[(j + 1) % 4]);
      if (!edgeMap[k])
        edgeMap[k] = { he, vStart: quad[j], vEnd: quad[(j + 1) % 4] };
      else {
        he.pair = edgeMap[k].he.id;
        edgeMap[k].he.pair = he.id;
      }
    }
    for (let j = 0; j < 4; j++) {
      hes[j].next = hes[(j + 1) % 4].id;
      hes[j].prev = hes[(j + 3) % 4].id;
      halfEdges[hes[j].id] = hes[j];
    }
    faces[faceId] = { id: faceId, halfEdge: hes[0].id };
  }

  // Top cap faces (triangles)
  for (let i = 0; i < radialSegments; i++) {
    const next = (i + 1) % radialSegments;
    const v0 = topCenter.id;
    const v1 = topVerts[next];
    const v2 = topVerts[i];
    const faceId = uuidv4();
    const hes: HalfEdge[] = [];
    const ids = [v0, v1, v2];
    for (let j = 0; j < 3; j++) {
      const he: HalfEdge = {
        id: uuidv4(),
        vertex: ids[(j + 1) % 3],
        pair: null,
        face: faceId,
        next: "",
        prev: "",
      };
      hes.push(he);
      const k = edgeKey(ids[j], ids[(j + 1) % 3]);
      if (!edgeMap[k])
        edgeMap[k] = { he, vStart: ids[j], vEnd: ids[(j + 1) % 3] };
      else {
        he.pair = edgeMap[k].he.id;
        edgeMap[k].he.pair = he.id;
      }
    }
    for (let j = 0; j < 3; j++) {
      hes[j].next = hes[(j + 1) % 3].id;
      hes[j].prev = hes[(j + 2) % 3].id;
      halfEdges[hes[j].id] = hes[j];
    }
    faces[faceId] = { id: faceId, halfEdge: hes[0].id };
  }

  // Bottom cap faces (triangles)
  for (let i = 0; i < radialSegments; i++) {
    const next = (i + 1) % radialSegments;
    const v0 = bottomCenter.id;
    const v1 = bottomVerts[i];
    const v2 = bottomVerts[next];
    const faceId = uuidv4();
    const hes: HalfEdge[] = [];
    const ids = [v0, v1, v2];
    for (let j = 0; j < 3; j++) {
      const he: HalfEdge = {
        id: uuidv4(),
        vertex: ids[(j + 1) % 3],
        pair: null,
        face: faceId,
        next: "",
        prev: "",
      };
      hes.push(he);
      const k = edgeKey(ids[j], ids[(j + 1) % 3]);
      if (!edgeMap[k])
        edgeMap[k] = { he, vStart: ids[j], vEnd: ids[(j + 1) % 3] };
      else {
        he.pair = edgeMap[k].he.id;
        edgeMap[k].he.pair = he.id;
      }
    }
    for (let j = 0; j < 3; j++) {
      hes[j].next = hes[(j + 1) % 3].id;
      hes[j].prev = hes[(j + 2) % 3].id;
      halfEdges[hes[j].id] = hes[j];
    }
    faces[faceId] = { id: faceId, halfEdge: hes[0].id };
  }

  // Assign outgoing half-edges to vertices
  vertices.forEach((v) => {
    v.halfEdge =
      Object.values(halfEdges).find((he) => he.vertex === v.id)?.id || null;
  });
  topCenter.halfEdge =
    Object.values(halfEdges).find((he) => he.vertex === topCenter.id)?.id ||
    null;
  bottomCenter.halfEdge =
    Object.values(halfEdges).find((he) => he.vertex === bottomCenter.id)?.id ||
    null;

  return {
    id: uuidv4(),
    vertices: Object.fromEntries(vertices.map((v) => [v.id, v])),
    halfEdges,
    faces,
    modifiers: [],
  };
}

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
