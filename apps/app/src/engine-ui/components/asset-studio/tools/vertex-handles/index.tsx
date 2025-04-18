import { useState, useEffect, useRef, useCallback } from "react";
import { Mesh, Vector3 } from "three";
import { useThreeDEditorStore } from "@/store/three-editor-store";
import { TransformControls } from "@react-three/drei";
import { useThree, ThreeEvent } from "@react-three/fiber";

// Internal type for OrbitControls from R3F
interface OrbitControlsType {
  enabled: boolean;
}

export function VertexHandles({
  mesh,
  objectId,
}: {
  mesh: Mesh;
  objectId: string;
}) {
  const { updateObject, objects } = useThreeDEditorStore();
  const [vertices, setVertices] = useState<Vector3[]>([]);
  const [selectedVertex, setSelectedVertex] = useState<number | null>(null);
  const handleMeshRefs = useRef<{ [idx: number]: Mesh | null }>({});
  const transformControlRef = useRef<any>(null);
  const { camera } = useThree();

  // Extract vertices from geometry (from mesh prop)
  useEffect(() => {
    if (!mesh.geometry) return;
    const posAttr = mesh.geometry.getAttribute("position");
    if (!posAttr) return;
    const verts: Vector3[] = [];
    for (let i = 0; i < posAttr.count; i++) {
      verts.push(new Vector3().fromBufferAttribute(posAttr, i));
    }
    setVertices(verts);
    handleMeshRefs.current = {};
  }, [mesh]);

  // Only update the store, never mutate mesh.geometry directly
  const syncPositionsToStore = useCallback(
    (verts: Vector3[]) => {
      const obj = objects.find((o) => o.id === objectId);
      if (!obj) return;
      const positions = verts.flatMap((v) => [v.x, v.y, v.z]);
      // Normals and indices are not recomputed here; let EditableGeometry handle it
      updateObject(objectId, {
        userData: {
          ...obj.userData,
          geometry: {
            type: obj.userData.geometry?.type || "box",
            parameters: {
              ...obj.userData.geometry?.parameters,
              positions,
            },
          },
        },
      });
    },
    [objectId, objects, updateObject]
  );

  // Disable orbit controls when transform controls are being used
  useEffect(() => {
    const controls = transformControlRef.current;
    if (!controls) return;
    const onDraggingChange = (event: { value: boolean }) => {
      const orbitControls = (
        document.querySelector("canvas")?.parentElement as any
      )?.__r3f?.controls as OrbitControlsType | undefined;
      if (orbitControls) {
        orbitControls.enabled = !event.value;
      }
      // On drag end, sync to store
      if (!event.value && selectedVertex !== null) {
        const handleMesh = handleMeshRefs.current[selectedVertex];
        if (handleMesh) {
          const updatedVertices = [...vertices];
          updatedVertices[selectedVertex] = handleMesh.position.clone();
          syncPositionsToStore(updatedVertices);
        }
      }
    };
    controls.addEventListener("dragging-changed", onDraggingChange);
    return () => {
      controls.removeEventListener("dragging-changed", onDraggingChange);
    };
  }, [selectedVertex, vertices, syncPositionsToStore]);

  // On drag, update local state for immediate feedback
  const handleVertexDrag = useCallback(
    (idx: number) => {
      const handleMesh = handleMeshRefs.current[idx];
      if (!handleMesh) return;
      const newVerts = [...vertices];
      newVerts[idx] = handleMesh.position.clone();
      setVertices(newVerts);
    },
    [vertices]
  );

  // Handle selection of vertex
  const handleSelectVertex = useCallback(
    (idx: number, e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      setSelectedVertex(idx);
      if (handleMeshRefs.current[idx]) {
        handleMeshRefs.current[idx]!.position.copy(vertices[idx]);
      }
    },
    [vertices]
  );

  return (
    <>
      {vertices.map((v, i) => (
        <group key={i}>
          <mesh
            ref={(ref) => (handleMeshRefs.current[i] = ref)}
            position={[v.x, v.y, v.z]}
            onClick={(e) => handleSelectVertex(i, e)}
            scale={selectedVertex === i ? 1.2 : 1}
          >
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshStandardMaterial
              color={selectedVertex === i ? "#bef264" : "#22c55e"}
            />
          </mesh>
          {selectedVertex === i && handleMeshRefs.current[i] && (
            <TransformControls
              ref={transformControlRef}
              object={handleMeshRefs.current[i]}
              camera={camera}
              mode="translate"
              showX
              showY
              showZ
              size={0.5}
              onObjectChange={() => handleVertexDrag(i)}
            />
          )}
        </group>
      ))}
    </>
  );
}
