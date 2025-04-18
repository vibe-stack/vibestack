import { useEffect } from "react"
import * as THREE from "three"
import { useThreeDEditorStore } from "@/store/three-editor-store"

export const useInitialScene = () => {
  const { objects, addObject } = useThreeDEditorStore()
  
  // Initialize default objects if needed
  useEffect(() => {
    // Add default objects if there are none
    if (objects.length === 0) {
      // Extract vertices from a BoxGeometry
      const boxGeom = new THREE.BoxGeometry(1, 1, 1);
      const posAttr = boxGeom.getAttribute("position");
      
      if (!posAttr) {
        console.error("Failed to get position attribute from BoxGeometry");
        return;
      }
      
      const vertices: [number, number, number][] = [];
      for (let i = 0; i < posAttr.count; i++) {
        vertices.push([
          posAttr.getX(i),
          posAttr.getY(i),
          posAttr.getZ(i)
        ]);
      }
      
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
      })
      
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
          geometry: { 
            type: "box",
            parameters: {
              width: 1,
              height: 1,
              depth: 1,
              vertices
            }
          },
          material: { 
            type: "standard", 
            color: "#22c55e" 
          },
          castShadow: true,
          receiveShadow: true
        }
      })
    }
  }, [objects.length, addObject])
} 