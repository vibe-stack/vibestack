import { Canvas } from "@react-three/fiber";
import { useEditorStore } from "../../editor/store";
import { OrbitControls, PerspectiveCamera, OrthographicCamera } from "@react-three/drei";
import CameraBar from "./camera-bar";
import { useOrbitControls } from "./use-orbit-controls";
import UnselectedMeshes from './unselected-meshes'
import ObjectModeControls from './object-mode-controls'
import EditModeOverlays from './edit-mode-overlays'
import React from "react";

export default function ViewportCanvas() {
  const cameraType = useEditorStore((s) => s.cameraType);
  const mode = useEditorStore((s) => s.mode);
  const selection = useEditorStore((s) => s.selection);
  const [orbitEnabled] = useOrbitControls();

  function handlePointerMissed() {
    if (mode === 'object') {
      useEditorStore.getState().setSelection({ ...selection, objectIds: [] });
    } else if (mode === 'edit-vertex') {
      useEditorStore.getState().setSelection({ ...selection, elementType: 'vertex', elementIds: [] });
    } else if (mode === 'edit-edge') {
      useEditorStore.getState().setSelection({ ...selection, elementType: 'edge', elementIds: [] });
    } else if (mode === 'edit-face') {
      useEditorStore.getState().setSelection({ ...selection, elementType: 'face', elementIds: [] });
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 relative">
        <Canvas onPointerMissed={handlePointerMissed}>
          {cameraType === "perspective" ? (
            <PerspectiveCamera makeDefault position={[4, 3, 8]} />
          ) : (
            <OrthographicCamera
              makeDefault
              position={[4, 3, 8]}
              zoom={100}
              near={0.1}
              far={1000}
            />
          )}
          <OrbitControls enabled={orbitEnabled} />
          <gridHelper args={[100, 100, '#222', '#333']} />
          <UnselectedMeshes />
          {mode === 'object' && selection.objectIds.length === 1 ? (
            <ObjectModeControls />
          ) : (
            <EditModeOverlays />
          )}
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={0.7} />
        </Canvas>
      </div>
      <CameraBar />
    </div>
  );
}
