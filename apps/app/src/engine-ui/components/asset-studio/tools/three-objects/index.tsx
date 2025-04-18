import { Select } from "@react-three/drei";
import { useRef } from "react";
import { Mesh, Object3D } from "three";
import { useThreeDEditorStore } from "@/store/three-editor-store";
import { MeshObject } from "../mesh-object";
import { VertexHandles } from "../vertex-handles";

export function ThreeObjects() {
  const { objects, selectedObjectId, selectObject, isEditing, editMode } = useThreeDEditorStore();
  const meshRefs = useRef<Record<string, Mesh | null>>({})

  const handleSelect = (e: { object: Object3D; stopPropagation: () => void }) => {
    if (e.object.name !== selectedObjectId) {
      selectObject(e.object.name)
    }
    e.stopPropagation()
  }

  return (
    <>
      {objects.map((object) => {
        if (!object.userData.geometry && object.type === "mesh") return null
        const setMeshRef = (ref: Mesh | null) => {
          meshRefs.current[object.id] = ref
        }
        const isInVertexEditMode = isEditing && editMode === 'vertex' && selectedObjectId === object.id;

        return (
          <Select 
            key={object.id} 
            box
            onPointerDown={isInVertexEditMode ? undefined : handleSelect}
          >
            <MeshObject 
              object={object} 
              isSelected={selectedObjectId === object.id}
              meshRef={setMeshRef}
            />
            {isEditing && editMode === 'vertex' && selectedObjectId === object.id && meshRefs.current[object.id] ? (
              <VertexHandles mesh={meshRefs.current[object.id]!} objectId={object.id} />
            ) : null}
          </Select>
        )
      })}
    </>
  )
}