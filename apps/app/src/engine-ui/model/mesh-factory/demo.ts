import { HEMesh, HEVertex, HEFace, HalfEdge } from "../mesh";
import { v4 as uuidv4 } from "uuid";

function createDemoMesh(): HEMesh {
  // Define vertices for a detailed low-poly pirate ship
  // Dimensions: Length ~10 units, Width ~3 units, Height ~5 units (including masts)
  const positions: [number, number, number][] = [
    // Hull Bottom (0-7)
    [5, 0, 0],      // 0: Bow keel
    [-5, 0, 0],     // 1: Stern keel
    [3, 0, 1],      // 2: Mid right bottom
    [3, 0, -1],     // 3: Mid left bottom
    [-3, 0, 1],     // 4: Rear right bottom
    [-3, 0, -1],    // 5: Rear left bottom
    [1, 0, 1.2],    // 6: Front right bottom
    [1, 0, -1.2],   // 7: Front left bottom

    // Hull Top/Deck Edge (8-15)
    [4, 1, 1.5],    // 8: Bow right deck
    [4, 1, -1.5],   // 9: Bow left deck
    [2, 1, 1.8],    // 10: Mid right deck
    [2, 1, -1.8],   // 11: Mid left deck
    [-2, 1, 1.8],   // 12: Rear right deck
    [-2, 1, -1.8],  // 13: Rear left deck
    [-4, 1.5, 1.5], // 14: Stern right deck
    [-4, 1.5, -1.5],// 15: Stern left deck

    // Stern Details (16-19)
    [-4.5, 2, 0],   // 16: Stern top
    [-4, 1.5, 0],   // 17: Stern mid
    [-4.5, 2, 0.5], // 18: Stern right rail
    [-4.5, 2, -0.5],// 19: Stern left rail

    // Bow Details (20-21)
    [5, 1.5, 0],    // 20: Bow tip
    [4.5, 1.2, 0],  // 21: Bow mid

    // Main Mast (22-25)
    [0, 1, 0],      // 22: Main mast base
    [0, 5, 0],      // 23: Main mast top
    [0, 3, 0.2],    // 24: Main sail mid right
    [0, 3, -0.2],   // 25: Main sail mid left

    // Fore Mast (26-29)
    [2.5, 1, 0],    // 26: Fore mast base
    [2.5, 4, 0],    // 27: Fore mast top
    [2.5, 2.5, 0.2],// 28: Fore sail mid right
    [2.5, 2.5, -0.2],// 29: Fore sail mid left

    // Deck Features (30-33)
    [0, 1.2, 0.5],  // 30: Main deck hatch right
    [0, 1.2, -0.5], // 31: Main deck hatch left
    [-2, 1.2, 0.5], // 32: Rear deck hatch right
    [-2, 1.2, -0.5],// 33: Rear deck hatch left
  ];

  const vertices: HEVertex[] = positions.map((pos) => ({
    id: uuidv4(),
    position: pos,
    halfEdge: null,
  }));

  // Define faces (mostly quads, some triangles for bow/stern/masts)
  const faceVerts = [
    // Hull Bottom
    [0, 6, 2, 3], [0, 3, 7, 6], // Bow bottom
    [2, 4, 5, 3], [4, 1, 5, 4], // Mid to stern bottom

    // Hull Sides
    [6, 8, 10, 2], [7, 11, 9, 8], // Front right/left
    [2, 10, 12, 4], [3, 5, 13, 11], // Mid right/left
    [4, 12, 14, 1], [5, 15, 13, 5], // Rear right/left

    // Deck
    [8, 9, 11, 10], [10, 11, 13, 12], [12, 13, 15, 14], // Main deck
    [30, 31, 33, 32], // Deck hatch (simplified)

    // Bow
    [0, 20, 8, 6], [0, 9, 20, 7], [8, 20, 9, 8], // Bow front
    [20, 21, 8, 9], // Bow tip

    // Stern
    [1, 14, 16, 15], [14, 18, 16, 14], [15, 16, 19, 15], // Stern back
    [16, 18, 19, 16], // Stern rail

    // Main Mast
    [22, 24, 23, 22], [22, 23, 25, 22], // Mast (simplified quads)
    [24, 25, 23, 24], // Sail (single quad)

    // Fore Mast
    [26, 28, 27, 26], [26, 27, 29, 26], // Mast (simplified quads)
    [28, 29, 27, 28], // Sail (single quad)
  ];

  const halfEdges: Record<string, HalfEdge> = {};
  const faces: Record<string, HEFace> = {};
  const edgeMap: Record<string, { he: HalfEdge; vStart: number; vEnd: number }> = {};
  const edgeKey = (a: number, b: number) => (a < b ? `${a}_${b}` : `${b}_${a}`);

  faceVerts.forEach((verts) => {
    const faceId = uuidv4();
    const hes: HalfEdge[] = [];
    const vertCount = verts.length;
    for (let i = 0; i < vertCount; i++) {
      const vStart = verts[i];
      const vEnd = verts[(i + 1) % vertCount];
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
    for (let i = 0; i < vertCount; i++) {
      hes[i].next = hes[(i + 1) % vertCount].id;
      hes[i].prev = hes[(i - 1 + vertCount) % vertCount].id;
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

export default createDemoMesh;