import { useThreeDEditorStore } from "@/store/three-editor-store";
import SceneTree from "../scene-tree";
import Inspector from "../object-inspector";
import Toolbar from "../editor-toolbar";
import Bottombar from "../editor-bottombar";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  OrbitControls,
  Grid,
  PerspectiveCamera,
  OrthographicCamera,
} from "@react-three/drei";
import { TransformMode } from "./hooks/use-transform-controls";
import { useInitialScene } from "./hooks/use-initial-scene";
import { ThreeObjects } from "../tools/three-objects";
import { TransformTool } from "../tools/transform-tool";

function SceneSetup() {
  const { scene, setScene, setPerspectiveCamera, setOrthographicCamera } =
    useThreeDEditorStore();
  const { scene: threeScene, camera } = useThree();

  // Initialize the scene with default objects if needed
  useInitialScene();

  // Sync R3F scene with store
  useEffect(() => {
    // Only update if actually different to prevent loops
    if (scene !== threeScene) {
      // Debounce the scene update
      const timeout = setTimeout(() => {
        setScene(threeScene);
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [threeScene, scene, setScene]);

  // Handle camera updates
  useEffect(() => {
    if (!camera) return;

    // Use a timeout to prevent potential update loops
    const timeout = setTimeout(() => {
      if (camera instanceof THREE.PerspectiveCamera) {
        setPerspectiveCamera(camera);
      } else if (camera instanceof THREE.OrthographicCamera) {
        setOrthographicCamera(camera);
      }
    }, 0);

    return () => clearTimeout(timeout);
  }, [camera, setPerspectiveCamera, setOrthographicCamera]);

  return null;
}

export default function ThreeDEditor() {
  const { isPanelOpen, cameraType, selectedObjectId } = useThreeDEditorStore();
  const [transformMode, setTransformMode] =
    useState<TransformMode>("translate");
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<null | "vertex" | "edge" | "face">(
    null
  );

  const setTransformControlsMode = (mode: TransformMode) => {
    setTransformMode(mode);
  };

  // When exiting edit mode, reset editMode
  useEffect(() => {
    if (!isEditing) setEditMode(null);
  }, [isEditing]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-zinc-950">
      {/* Scene tree panel (left) */}
      {isPanelOpen.sceneTree && (
        <div className="w-64 border-r border-zinc-800 bg-zinc-900/50">
          <SceneTree />
        </div>
      )}
      {/* Main 3D view */}
      <div className="flex flex-col flex-1">
        {/* Toolbar */}
        <div className="h-10 border-b border-zinc-800 bg-zinc-900/50">
          <Toolbar
            onTransformModeChange={setTransformControlsMode}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            editMode={editMode}
            setEditMode={setEditMode}
            canEdit={!!selectedObjectId}
          />
        </div>
        {/* 3D viewport */}
        <div className={cn("flex-1 relative")}>
          <Canvas shadows>
            <SceneSetup />
            <ThreeObjects isEditing={isEditing} editMode={editMode} />
            {/* Only show main TransformTool if not editing */}
            {!isEditing && (
              <TransformTool
                transformMode={transformMode}
                setTransformControlsMode={setTransformControlsMode}
              />
            )}
            {/* Camera */}
            {cameraType === "perspective" ? (
              <PerspectiveCamera makeDefault position={[5, 5, 5]} />
            ) : (
              <OrthographicCamera makeDefault position={[5, 5, 5]} zoom={50} />
            )}
            {/* Controls and Helpers */}
            <OrbitControls makeDefault />
            <Grid infiniteGrid fadeDistance={80} fadeStrength={1.5} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          </Canvas>
          {/* Transform mode overlay info */}
          <div className="absolute bottom-2 left-2 bg-zinc-900/70 rounded-md px-2 py-1 text-xs text-zinc-400">
            Mode:{" "}
            {transformMode.charAt(0).toUpperCase() + transformMode.slice(1)} |{" "}
            Press G (move), R (rotate), S (scale), Del (delete), Esc (deselect)
          </div>
        </div>
        {/* Bottom bar */}
        <div className="h-8 border-t border-zinc-800 bg-zinc-900/50">
          <Bottombar />
        </div>
      </div>
      {/* Inspector panel (right) */}
      {isPanelOpen.inspector && (
        <div className="w-72 border-l border-zinc-800 bg-zinc-900/50">
          <Inspector />
        </div>
      )}
    </div>
  );
}
