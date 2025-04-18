import { useEffect } from "react";
import * as THREE from "three";
import { useThreeDEditorStore } from "@/store/three-editor-store";
import { syncObjectsToScene } from "../utils";

// Custom hook for syncing objects
export const useObjectSync = (
  isInitialized: boolean,
  objectsRef: Map<string, THREE.Object3D>
) => {
  const { objects, addObject } = useThreeDEditorStore();
  
  // Initialize default objects if needed
  useEffect(() => {
    if (!isInitialized) return;
    
    const scene = useThreeDEditorStore.getState().scene;
    if (!scene) return;
    
    // Add default objects if there are none
    if (objects.length === 0) {
      // Add a default ambient light to the scene (but not the store)
      const ambientLight = new THREE.AmbientLight(0x404040);
      scene.add(ambientLight);
      
      // Add initial objects to the store
      addObject({
        id: `directional-light-${Math.random().toString(36).substring(2, 11)}`,
        name: "Directional Light",
        type: "light",
        position: new THREE.Vector3(5, 10, 7.5),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1),
        visible: true,
        expanded: false,
        userData: {
          light: { 
            color: "#ffffff", 
            intensity: 1,
            castShadow: true 
          }
        }
      });
      
      // Add a default cube to the store
      addObject({
        id: `default-cube-${Math.random().toString(36).substring(2, 11)}`,
        name: "Cube",
        type: "mesh",
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1),
        visible: true,
        expanded: false,
        userData: {
          geometry: { type: "box" },
          material: { type: "standard", color: "#22c55e" },
          castShadow: true,
          receiveShadow: true
        }
      });
    } else {
      // Sync objects from store
      syncObjectsToScene(scene, objects, objectsRef);
    }
  }, [isInitialized, objects.length, addObject, objectsRef]);
  
  // Sync objects when they change
  useEffect(() => {
    if (!isInitialized) return;
    
    const scene = useThreeDEditorStore.getState().scene;
    if (scene) {
      syncObjectsToScene(scene, objects, objectsRef);
    }
  }, [objects, isInitialized, objectsRef]);
  
  // Handle camera switching
  useEffect(() => {
    if (!isInitialized) return;
    
    const cameraType = useThreeDEditorStore.getState().cameraType;
    const camera = cameraType === "perspective" 
      ? useThreeDEditorStore.getState().perspectiveCamera
      : useThreeDEditorStore.getState().orthographicCamera;
      
    if (camera) {
      // Note: We need to update the store to include orbitControls and transformControls
      // This is temporarily disabled until the store is updated
      
      // if (controls) {
      //   controls.object = camera;
      // }
      
      // Update transform controls camera
      // if (transformControls) {
      //   transformControls.camera = camera;
      // }
    }
  }, [useThreeDEditorStore.getState().cameraType, isInitialized]);
}; 