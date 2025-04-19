export type Mesh = {
  vertices: Record<string, { id: string; position: [number, number, number] }>;
  edges: Record<string, { id: string; v1: string; v2: string }>;
  faces: Record<string, { id: string; vertices: string[] }>;
};

export function findMeshLoops(mesh: Mesh): string[][] {
  // Build edge-to-faces and vertex-pair-to-edge maps
  const edgeToFaces: Record<string, string[]> = {};
  const edgeMap: Record<string, string> = {};
  for (const [eid, edge] of Object.entries(mesh.edges)) {
    const key1 = `${edge.v1}-${edge.v2}`;
    const key2 = `${edge.v2}-${edge.v1}`;
    edgeMap[key1] = eid;
    edgeMap[key2] = eid;
    edgeToFaces[eid] = [];
  }

  // Map edges to their adjacent faces
  for (const face of Object.values(mesh.faces)) {
    if (face.vertices.length !== 4) continue; // Quad-only
    for (let i = 0; i < 4; i++) {
      const v1 = face.vertices[i];
      const v2 = face.vertices[(i + 1) % 4];
      const edgeId = edgeMap[`${v1}-${v2}`] || edgeMap[`${v2}-${v1}`];
      if (!edgeId) continue;
      edgeToFaces[edgeId].push(face.id);
    }
  }

  const visited = new Set<string>();
  const loops: string[][] = [];

  for (const edgeId of Object.keys(mesh.edges)) {
    if (visited.has(edgeId)) continue;
    const faces = edgeToFaces[edgeId];
    if (!faces || faces.length === 0) continue; // Skip boundary or unused edges

    let currentEdge = edgeId;
    let currentFace = faces[0];
    const loop: string[] = [];

    while (true) {
      if (visited.has(currentEdge)) break;
      loop.push(currentEdge);
      visited.add(currentEdge);

      const face = mesh.faces[currentFace];
      if (!face || face.vertices.length !== 4) break;

      // Find the current edge's vertices in the face
      const edge = mesh.edges[currentEdge];
      const v1Index = face.vertices.indexOf(edge.v1);
      const v2Index = face.vertices.indexOf(edge.v2);
      if (v1Index === -1 || v2Index === -1) break;

      // Get opposite edge vertices (the other two vertices in the quad)
      const otherVertices = face.vertices.filter((_, i) => i !== v1Index && i !== v2Index);
      if (otherVertices.length !== 2) break;
      const oppV1 = otherVertices[0];
      const oppV2 = otherVertices[1];

      // Find the opposite edge
      const nextEdgeId = edgeMap[`${oppV1}-${oppV2}`] || edgeMap[`${oppV2}-${oppV1}`];
      if (!nextEdgeId) break;

      // Find the next face sharing the opposite edge (not the current face)
      const nextFaces = edgeToFaces[nextEdgeId]?.filter(fid => fid !== currentFace);
      if (!nextFaces || nextFaces.length === 0) break; // Boundary edge

      // Check for loop closure
      if (loop.length > 1) {
        const nextEdge = mesh.edges[nextEdgeId];
        const startEdge = mesh.edges[edgeId];
        if (
          nextEdge.v1 === startEdge.v1 || nextEdge.v2 === startEdge.v1 ||
          nextEdge.v1 === startEdge.v2 || nextEdge.v2 === startEdge.v2
        ) {
          loop.push(nextEdgeId); // Include the closing edge
          visited.add(nextEdgeId);
          break; // Closed loop
        }
      }

      currentEdge = nextEdgeId;
      currentFace = nextFaces[0];
    }

    if (loop.length >= 1) loops.push(loop); // Include loops of any length
  }

  return loops;
}