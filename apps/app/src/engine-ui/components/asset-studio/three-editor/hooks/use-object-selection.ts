import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useThreeDEditorStore } from "@/store/three-editor-store";

// Custom hook for handling object selection via raycasting
export const useObjectSelection = (
  mountRef: React.RefObject<HTMLDivElement | null>,
  isInitialized: boolean,
  isDraggingRef: React.MutableRefObject<boolean>,
  objectsRef: React.MutableRefObject<Map<string, THREE.Object3D>>
) => {
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const isTransformControlsClickRef = useRef<boolean>(false);
  
  const { selectObject } = useThreeDEditorStore();
  
  // Handle object click selection via raycasting
  const handleObjectSelection = (event: MouseEvent) => {
    if (!isInitialized) return;
    
    const scene = useThreeDEditorStore.getState().scene;
    const camera = useThreeDEditorStore.getState().activeCamera;
    
    if (!scene || !camera || !mountRef.current) return;
    
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update the raycaster
    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    
    // First, check if we're clicking on transform controls
    // Get all objects in the scene including helpers
    const allObjects: THREE.Object3D[] = [];
    scene.traverse((object) => {
      // Only add objects that might be transform controls
      if (object.type === 'Mesh' && 
          (object.name.includes('helper') || 
           object.parent?.name.includes('helper') || 
           object.parent?.parent?.name.includes('helper'))) {
        allObjects.push(object);
      }
    });
    
    // Check if we're clicking on a transform control
    const transformIntersects = raycasterRef.current.intersectObjects(allObjects, true);
    isTransformControlsClickRef.current = transformIntersects.length > 0;
    
    // If we're clicking on transform controls, don't proceed with selection
    if (isTransformControlsClickRef.current || isDraggingRef.current) {
      return;
    }
    
    // Get all selectable objects (exclude helpers, controls, etc.)
    const selectableObjects: THREE.Object3D[] = [];
    objectsRef.current.forEach((object) => {
      selectableObjects.push(object);
    });
    
    // Find intersections
    const intersects = raycasterRef.current.intersectObjects(selectableObjects, true);
    
    if (intersects.length > 0) {
      // Find the first intersected object that has an ID (from our store)
      let selectedObject = intersects[0].object;
      
      // Walk up the parent chain until we find an object with a name that matches an ID
      while (selectedObject && !objectsRef.current.has(selectedObject.name)) {
        if (selectedObject.parent) {
          selectedObject = selectedObject.parent;
        } else {
          break;
        }
      }
      
      // If we found a valid object, select it
      if (selectedObject && objectsRef.current.has(selectedObject.name)) {
        selectObject(selectedObject.name);
      }
    } else {
      // Only deselect if we're not clicking transform controls
      selectObject(null);
    }
  };
  
  // Setup click event listener
  useEffect(() => {
    if (!isInitialized || !mountRef.current) return;
    
    // Add click listener for object selection
    const handleClick = (event: MouseEvent) => {
      // Skip selection if transform controls are in use
      if (isDraggingRef.current) {
        return;
      }
      handleObjectSelection(event);
    };
    
    const canvas = mountRef.current.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('pointerdown', handleClick);
      
      return () => {
        canvas.removeEventListener('pointerdown', handleClick);
      };
    }
  }, [isInitialized, isDraggingRef]);
  
  // Highlight selected object
  useEffect(() => {
    if (!isInitialized) return;
    
    const selectedObjectId = useThreeDEditorStore.getState().selectedObjectId;
    
    // Reset outline on all objects
    objectsRef.current.forEach((object) => {
      if (object instanceof THREE.Mesh) {
        const material = object.material as THREE.MeshStandardMaterial;
        material.emissive = new THREE.Color(0x000000);
      }
    });
    
    // Set outline on selected object
    if (selectedObjectId) {
      const selectedObject = objectsRef.current.get(selectedObjectId);
      if (selectedObject instanceof THREE.Mesh) {
        const material = selectedObject.material as THREE.MeshStandardMaterial;
        material.emissive = new THREE.Color(0x114422);
      }
    }
  }, [useThreeDEditorStore.getState().selectedObjectId, isInitialized, objectsRef]);
}; 