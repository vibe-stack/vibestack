import { HEMesh, HEVertex, HEFace, HalfEdge } from "../mesh";
import { v4 as uuidv4 } from "uuid";

function createSphereMesh(): HEMesh {
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
  const edgeMap: Record<string, { he: HalfEdge; vStart: string; vEnd: string }> = {};
  const edgeKey = (a: string, b: string) => (a < b ? `${a}_${b}` : `${b}_${a}`);

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
    v.halfEdge = Object.values(halfEdges).find((he) => he.vertex === v.id)?.id || null;
  });
  northPole.halfEdge = Object.values(halfEdges).find((he) => he.vertex === northPole.id)?.id || null;
  southPole.halfEdge = Object.values(halfEdges).find((he) => he.vertex === southPole.id)?.id || null;

  return {
    id: uuidv4(),
    vertices: Object.fromEntries(vertices.map((v) => [v.id, v])),
    halfEdges,
    faces,
    modifiers: [],
  };
}

export default createSphereMesh; 