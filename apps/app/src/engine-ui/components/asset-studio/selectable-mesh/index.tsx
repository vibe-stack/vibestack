import { useEditorStore } from "@/engine-ui/editor/store";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { meshToBufferGeometry } from "@/engine-ui/utils/mesh-to-geometry";
import { MaterialRenderer } from "./material-renderer";

export function SelectableMesh({
  objectId,
  mesh,
}: {
  objectId: string;
  mesh: any;
}) {
  const setSelection = useEditorStore((s) => s.setSelection);
  const selection = useEditorStore((s) => s.selection);
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => meshToBufferGeometry(mesh), [mesh]);
  const scene = useEditorStore((s) => s.scene);
  const obj = scene?.objects[objectId];

  if (!obj || !obj.visible) return null;

  const { position, rotation, scale } = obj.transform;
  const material = obj.materialId ? scene?.materials?.[obj.materialId] : undefined;
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
      geometry={geometry}
      castShadow={obj.castShadow}
      receiveShadow={obj.receiveShadow}
      onClick={(e) => {
        e.stopPropagation();
        if (selection.objectIds.includes(objectId)) {
          if (e.shiftKey) {
            setSelection({
              ...selection,
              objectIds: selection.objectIds.filter((id) => id !== objectId),
            });
          } else {
            setSelection({ ...selection, objectIds: [objectId] });
          }
        } else {
          if (e.shiftKey) {
            setSelection({
              ...selection,
              objectIds: [...selection.objectIds, objectId],
            });
          } else {
            setSelection({ ...selection, objectIds: [objectId] });
          }
        }
      }}
    >
      <MaterialRenderer obj={obj} material={material} />
    </mesh>
  );
}