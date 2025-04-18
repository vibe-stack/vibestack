import { useState, useEffect, useRef } from "react";
import { Mesh, BufferGeometry, Vector3, Object3D, BufferAttribute } from "three";
import { useThreeDEditorStore } from "@/store/three-editor-store";
import { TransformControls } from "@react-three/drei";

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
  const geometryRef = useRef<BufferGeometry | null>(null);
  const isDraggingRef = useRef(false);
  const currentPositionRef = useRef<Vector3 | null>(null);

  // Extract vertices from geometry
  useEffect(() => {
    if (!mesh.geometry) return;
    
    // Ensure we're working with a BufferGeometry
    const posAttr = mesh.geometry.getAttribute("position");
    if (!posAttr) return;
    
    const verts: Vector3[] = [];
    for (let i = 0; i < posAttr.count; i++) {
      verts.push(new Vector3().fromBufferAttribute(posAttr, i));
    }
    setVertices(verts);
    geometryRef.current = mesh.geometry;
  }, [mesh]);

  // Add listeners for transform controls events
  useEffect(() => {
    if (selectedVertex === null) return;
    
    // Set up listeners
    const handleMouseDown = () => {
      isDraggingRef.current = true;
      
      // Store initial position when dragging starts
      if (selectedVertex !== null && selectedVertex < vertices.length) {
        currentPositionRef.current = vertices[selectedVertex].clone();
      }
    };
    
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        
        // Only sync if we have a valid current position
        if (currentPositionRef.current && selectedVertex !== null) {
          // Final position might already be in vertices array, but let's ensure it's accurate
          const currentVertices = [...vertices];
          // Double check position is updated in our vertices array
          if (geometryRef.current) {
            const posAttr = geometryRef.current.getAttribute("position");
            currentVertices[selectedVertex] = new Vector3(
              posAttr.getX(selectedVertex),
              posAttr.getY(selectedVertex),
              posAttr.getZ(selectedVertex)
            );
          }
          
          // Sync to store
          syncVerticesToStore(currentVertices);
          currentPositionRef.current = null;
        }
      }
    };
    
    // Add global listeners for mouse events
    document.addEventListener('pointerup', handleMouseUp);
    document.addEventListener('pointerdown', handleMouseDown);
    
    return () => {
      document.removeEventListener('pointerup', handleMouseUp);
      document.removeEventListener('pointerdown', handleMouseDown);
    };
  }, [selectedVertex, vertices]);

  // Sync geometry to store
  const syncVerticesToStore = (verts: Vector3[]) => {
    // Find the object in the store
    const obj = objects.find((o) => o.id === objectId);
    if (!obj) return;
    
    // Create serializable vertex array
    const vertexArray = verts.map((v) => [v.x, v.y, v.z] as [number, number, number]);
    
    // Store type
    const prevType = obj.userData.geometry?.type || "box";
    
    // Preserve other parameters
    const existingParams = {...obj.userData.geometry?.parameters};
    delete existingParams.vertices; // Remove old vertices to avoid duplication
    
    // Create an updated userData object
    const userData = {
      ...obj.userData,
      geometry: {
        ...obj.userData.geometry,
        type: prevType,
        parameters: {
          ...existingParams,
          vertices: vertexArray,
        },
      },
    };
    
    // Update the object in the store
    updateObject(objectId, { userData });
  };

  // Handler for dragging a vertex
  const handleVertexDrag = (idx: number, newPos: Vector3) => {
    if (!geometryRef.current) return;
    
    // Get the position attribute directly to update the underlying array
    const posAttr = geometryRef.current.getAttribute("position") as BufferAttribute;
    
    // Update the position directly in the attribute array
    posAttr.setXYZ(idx, newPos.x, newPos.y, newPos.z);
    
    // Mark the attribute as needing update
    posAttr.needsUpdate = true;
    
    // Recompute vertex normals to update the mesh appearance
    geometryRef.current.computeVertexNormals();
    
    // Update our React state to match the updated geometry
    const newVerts = [...vertices];
    newVerts[idx] = new Vector3(newPos.x, newPos.y, newPos.z);
    setVertices(newVerts);
    
    // Store the current position for reference
    currentPositionRef.current = new Vector3(newPos.x, newPos.y, newPos.z);
  };

  return (
    <>
      {vertices.map((v, i) => (
        <group key={i}>
          {/* Clickable handle */}
          <mesh
            position={[v.x, v.y, v.z]}
            onPointerDown={(e) => {
              e.stopPropagation();
              setSelectedVertex(i);
            }}
            scale={selectedVertex === i ? 1.2 : 1}
          >
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshStandardMaterial
              color={selectedVertex === i ? "#bef264" : "#22c55e"}
            />
          </mesh>
          
          {/* Only show TransformControls for selected vertex */}
          {selectedVertex === i && (
            <TransformControls
              position={[v.x, v.y, v.z]}
              showX
              showY
              showZ
              size={0.3}
              object={undefined}
              onObjectChange={(e) => {
                if (!e || typeof e !== "object" || !("target" in e)) return;
                const target = e.target as Object3D;
                if (!("position" in target)) return;
                handleVertexDrag(i, target.position);
              }}
            >
              <mesh visible={false}>
                <boxGeometry args={[0.001, 0.001, 0.001]} />
                <meshStandardMaterial color="#bef264" transparent opacity={0} />
              </mesh>
            </TransformControls>
          )}
        </group>
      ))}
    </>
  );
}
