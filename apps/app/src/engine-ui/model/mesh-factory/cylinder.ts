import { HEMesh, HEVertex, HEFace, HalfEdge } from "../mesh";
import { v4 as uuidv4 } from "uuid";

function createCylinderMesh(): HEMesh {
  const radialSegments = 16;
  const height = 1;
  const radius = 0.5;
  const vertices: HEVertex[] = [];
  const topVerts: string[] = [];
  const bottomVerts: string[] = [];

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
  const edgeMap: Record<string, { he: HalfEdge; vStart: string; vEnd: string }> = {};
  const edgeKey = (a: string, b: string) => (a < b ? `${a}_${b}` : `${b}_${a}`);

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

  vertices.forEach((v) => {
    v.halfEdge = Object.values(halfEdges).find((he) => he.vertex === v.id)?.id || null;
  });
  topCenter.halfEdge = Object.values(halfEdges).find((he) => he.vertex === topCenter.id)?.id || null;
  bottomCenter.halfEdge = Object.values(halfEdges).find((he) => he.vertex === bottomCenter.id)?.id || null;

  return {
    id: uuidv4(),
    vertices: Object.fromEntries(vertices.map((v) => [v.id, v])),
    halfEdges,
    faces,
    modifiers: [],
  };
}

export default createCylinderMesh; 