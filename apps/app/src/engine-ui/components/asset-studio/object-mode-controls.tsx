import * as THREE from "three";
import { TransformControls } from "@react-three/drei";
import { useEditorStore } from "@/engine-ui/editor/store";
import GizmoMeshSync from "./gizmo-mesh-sync";
import { EdgeLines } from "./edit-mode/outlines";
import { useOrbitControls } from "./use-orbit-controls";
import React, { useState, useRef, useEffect } from "react";

export default function ObjectModeControls() {
  const scene = useEditorStore((s) => s.scene);
  const selection = useEditorStore((s) => s.selection);
  const gizmoMode = useEditorStore((s) => s.gizmoMode);
  const setObjectTransform = useEditorStore((s) => s.setObjectTransform);
  const [, setOrbitEnabled] = useOrbitControls();
  
  const [refReady, setRefReady] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<any>(null);

  // Always call hooks
  const objectId = selection.objectIds[0];
  const obj = scene && scene.objects[objectId];

  // Set initial transform from store
  useEffect(() => {
    if (obj && groupRef.current) {
      // Set transforms directly on the ThreeJS object
      groupRef.current.position.fromArray(obj.transform.position);
      groupRef.current.rotation.fromArray(obj.transform.rotation);
      groupRef.current.scale.fromArray(obj.transform.scale);
      
      // Mark as ready only after we've updated the position
      if (!refReady) {
        setRefReady(true);
      }
    }
  }, [obj?.transform, objectId, refReady]);

  // Connect transform controls to the group when both are ready
  useEffect(() => {
    if (refReady && groupRef.current && controlsRef.current) {
      controlsRef.current.attach(groupRef.current);
    }
  }, [refReady, controlsRef.current, groupRef.current]);

  // Manually detach and cleanup when unmounting
  useEffect(() => {
    return () => {
      if (controlsRef.current && controlsRef.current.object) {
        controlsRef.current.detach();
      }
    };
  }, []);

  if (!scene || selection.objectIds.length !== 1) return null;
  if (!obj || !obj.meshId) return null;
  const mesh = scene.meshes[obj.meshId];
  if (!mesh) return null;

  const material = obj.materialId ? scene.materials?.[obj.materialId] : undefined;

  function handleMouseUp() {
    setOrbitEnabled(true);
    if (groupRef.current) {
      setObjectTransform(objectId, {
        position: groupRef.current.position.toArray() as [number, number, number],
        rotation: [
          groupRef.current.rotation.x,
          groupRef.current.rotation.y,
          groupRef.current.rotation.z,
        ],
        scale: groupRef.current.scale.toArray() as [number, number, number],
      });
    }
  }

  return (
    <>
      <TransformControls
        ref={controlsRef}
        mode={gizmoMode}
        showX
        showY
        showZ
        enabled={true}
        onMouseDown={() => setOrbitEnabled(false)}
        onMouseUp={handleMouseUp}
      />
      <group
        ref={groupRef}
      >
        <GizmoMeshSync
          mesh={mesh}
          obj={obj}
          material={material}
        />
        <EdgeLines mesh={mesh} selectedIds={[]} onSelect={() => {}} edgeColor="#fbbf24" />
      </group>
    </>
  );
}
