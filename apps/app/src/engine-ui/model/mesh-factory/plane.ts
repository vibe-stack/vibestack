import { HEMesh, HEVertex, HEFace, HalfEdge } from "../mesh";
import { v4 as uuidv4 } from "uuid";

function createPlaneMesh(): HEMesh {
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

  he0.next = he1.id;
  he1.next = he2.id;
  he2.next = he3.id;
  he3.next = he0.id;
  he0.prev = he3.id;
  he1.prev = he0.id;
  he2.prev = he1.id;
  he3.prev = he2.id;

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

  const face: HEFace = { id: uuidv4(), halfEdge: he0.id };
  he0.face = face.id;
  he1.face = face.id;
  he2.face = face.id;
  he3.face = face.id;

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

export default createPlaneMesh; 