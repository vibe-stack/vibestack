import React from "react";
import { meshToBufferGeometry } from "@/engine-ui/utils/mesh-to-geometry";
import { MaterialRenderer } from "./selectable-mesh/material-renderer";

type GizmoMeshSyncProps = {
  mesh: any;
  obj: any;
  material: any;
};

function GizmoMeshSync({ mesh, obj, material }: GizmoMeshSyncProps) {
  return (
    <mesh
      geometry={meshToBufferGeometry(mesh)}
      castShadow={obj.castShadow}
      receiveShadow={obj.receiveShadow}
    >
      <MaterialRenderer obj={obj} material={material} />
    </mesh>
  );
}

export default GizmoMeshSync;
