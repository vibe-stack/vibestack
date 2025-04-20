import { HEMesh, HEVertex, HEFace, HalfEdge } from "../mesh";
import { v4 as uuidv4 } from "uuid";

function createCubeMesh(): HEMesh {
  // 8 vertices of a unit cube
  const positions: [number, number, number][] = [
    [-0.5, -0.5, -0.5],
    [0.5, -0.5, -0.5],
    [0.5, 0.5, -0.5],
    [-0.5, 0.5, -0.5],
    [-0.5, -0.5, 0.5],
    [0.5, -0.5, 0.5],
    [0.5, 0.5, 0.5],
    [-0.5, 0.5, 0.5],
  ];
  const vertices: HEVertex[] = positions.map((pos) => ({
    id: uuidv4(),
    position: pos,
    halfEdge: null,
  }));

  const faceVerts = [
    [3, 2, 1, 0],
    [4, 5, 6, 7],
    [0, 4, 7, 3],
    [2, 6, 5, 1],
    [3, 7, 6, 2],
    [0, 1, 5, 4],
  ];

  const halfEdges: Record<string, HalfEdge> = {};
  const faces: Record<string, HEFace> = {};
  const edgeMap: Record<string, { he: HalfEdge; vStart: number; vEnd: number }> = {};
  const edgeKey = (a: number, b: number) => (a < b ? `${a}_${b}` : `${b}_${a}`);

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
      const k = edgeKey(vStart, vEnd);
      if (!edgeMap[k]) edgeMap[k] = { he, vStart, vEnd };
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
  });

  vertices.forEach((v) => {
    v.halfEdge = Object.values(halfEdges).find((he) => he.vertex === v.id)?.id || null;
  });

  return {
    id: uuidv4(),
    vertices: Object.fromEntries(vertices.map((v) => [v.id, v])),
    halfEdges,
    faces,
    modifiers: [],
  };
}

export default createCubeMesh; 