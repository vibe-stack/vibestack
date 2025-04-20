import createCubeMesh from "./cube";
import createPlaneMesh from "./plane";
import createSphereMesh from "./sphere";
import createCylinderMesh from "./cylinder";
import { HEMesh } from "../mesh";

export type MeshType = "cube" | "plane" | "sphere" | "cylinder";

export function createMesh(type: MeshType): HEMesh {
  switch (type) {
    case "cube":
      return createCubeMesh();
    case "plane":
      return createPlaneMesh();
    case "sphere":
      return createSphereMesh();
    case "cylinder":
      return createCylinderMesh();
    default:
      throw new Error(`Unknown mesh type: ${type}`);
  }
} 