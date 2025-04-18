import * as THREE from "three"
import { ThreeDObject } from "@/store/three-editor-store"

// Create a Three.js object from our store object
export const createObject3D = (obj: ThreeDObject): THREE.Object3D => {
  let object3D: THREE.Object3D;
  
  // Create the appropriate object based on type
  if (obj.type === "mesh") {
    // Create geometry
    let geometry: THREE.BufferGeometry;
    const geoType = obj.userData.geometry?.type || "box";
    const params = obj.userData.geometry?.parameters || {};
    
    switch (geoType) {
      case "box":
        geometry = new THREE.BoxGeometry(
          params.width || 1, 
          params.height || 1, 
          params.depth || 1,
          params.widthSegments,
          params.heightSegments,
          params.depthSegments
        );
        break;
      case "sphere":
        geometry = new THREE.SphereGeometry(
          params.radius || 0.5,
          params.widthSegments || 32,
          params.heightSegments || 16
        );
        break;
      case "cylinder":
        geometry = new THREE.CylinderGeometry(
          params.radius || 0.5,
          params.radius || 0.5,
          params.height || 1,
          params.radialSegments || 32
        );
        break;
      case "plane":
        geometry = new THREE.PlaneGeometry(
          params.width || 1,
          params.height || 1,
          params.widthSegments,
          params.heightSegments
        );
        break;
      default:
        geometry = new THREE.BoxGeometry();
    }
    
    // Create material
    let material: THREE.Material;
    const matType = obj.userData.material?.type || "standard";
    const color = obj.userData.material?.color ? new THREE.Color(obj.userData.material.color) : new THREE.Color(0x22c55e);
    const wireframe = obj.userData.material?.wireframe || false;
    
    switch (matType) {
      case "basic":
        material = new THREE.MeshBasicMaterial({ color, wireframe });
        break;
      case "phong":
        material = new THREE.MeshPhongMaterial({ color, wireframe });
        break;
      case "lambert":
        material = new THREE.MeshLambertMaterial({ color, wireframe });
        break;
      case "normal":
        material = new THREE.MeshNormalMaterial({ wireframe });
        break;
      default:
        material = new THREE.MeshStandardMaterial({ color, wireframe });
    }
    
    if (obj.userData.material?.flatShading) {
      (material as THREE.MeshStandardMaterial).flatShading = true;
    }
    
    if (obj.userData.material?.side) {
      switch (obj.userData.material.side) {
        case "front":
          material.side = THREE.FrontSide;
          break;
        case "back":
          material.side = THREE.BackSide;
          break;
        case "double":
          material.side = THREE.DoubleSide;
          break;
      }
    }
    
    // Create the mesh
    const mesh = new THREE.Mesh(geometry, material);
    object3D = mesh;
    
    // Set shadow properties
    mesh.castShadow = obj.userData.castShadow || false;
    mesh.receiveShadow = obj.userData.receiveShadow || false;
  } else if (obj.type === "light") {
    // Handle lights
    const lightColor = obj.userData.light?.color ? new THREE.Color(obj.userData.light.color) : new THREE.Color(0xffffff);
    const intensity = obj.userData.light?.intensity || 1;
    const distance = obj.userData.light?.distance || 0;
    
    let light: THREE.Light;
    
    if (obj.name.includes("Directional")) {
      light = new THREE.DirectionalLight(lightColor, intensity);
      if (obj.userData.light?.castShadow) {
        light.castShadow = true;
      }
    } else {
      // Default to point light
      light = new THREE.PointLight(lightColor, intensity, distance);
      if (obj.userData.light?.castShadow) {
        light.castShadow = true;
      }
    }
    
    object3D = light;
  } else {
    // Default to Object3D for any other types
    object3D = new THREE.Object3D();
  }
  
  // Set common properties
  object3D.name = obj.id;
  object3D.position.copy(obj.position);
  object3D.rotation.copy(obj.rotation);
  object3D.scale.copy(obj.scale);
  object3D.visible = obj.visible;
  
  return object3D;
};

// Sync single store object to scene
export const syncObjectToScene = (
  obj: ThreeDObject, 
  scene: THREE.Scene, 
  objectsRef: Map<string, THREE.Object3D>
) => {
  // Get or create the Three.js object
  let object3D = objectsRef.get(obj.id);
  
  if (!object3D) {
    // Create new object
    object3D = createObject3D(obj);
    scene.add(object3D);
    objectsRef.set(obj.id, object3D);
  } else {
    // Update existing object
    object3D.position.copy(obj.position);
    object3D.rotation.copy(obj.rotation);
    object3D.scale.copy(obj.scale);
    object3D.visible = obj.visible;
    
    // Update material if it's a mesh
    if (obj.type === 'mesh' && object3D instanceof THREE.Mesh) {
      const material = object3D.material as THREE.MeshStandardMaterial;
      
      // Update material properties if they exist
      if (obj.userData.material) {
        if (obj.userData.material.color) {
          material.color.set(obj.userData.material.color);
        }
        
        if (obj.userData.material.wireframe !== undefined) {
          material.wireframe = obj.userData.material.wireframe;
        }
        
        if (obj.userData.material.flatShading !== undefined) {
          material.flatShading = obj.userData.material.flatShading;
          material.needsUpdate = true;
        }
        
        if (obj.userData.material.side) {
          switch (obj.userData.material.side) {
            case "front":
              material.side = THREE.FrontSide;
              break;
            case "back":
              material.side = THREE.BackSide;
              break;
            case "double":
              material.side = THREE.DoubleSide;
              break;
          }
          material.needsUpdate = true;
        }
      }
      
      // Update shadow properties
      object3D.castShadow = obj.userData.castShadow || false;
      object3D.receiveShadow = obj.userData.receiveShadow || false;
    }
    
    // Update light properties
    if (obj.type === 'light') {
      if (object3D instanceof THREE.Light) {
        if (obj.userData.light) {
          if (obj.userData.light.color) {
            object3D.color.set(obj.userData.light.color);
          }
          
          if (obj.userData.light.intensity !== undefined) {
            object3D.intensity = obj.userData.light.intensity;
          }
          
          if (obj.userData.light.castShadow !== undefined) {
            object3D.castShadow = obj.userData.light.castShadow;
          }
          
          if (obj.userData.light.distance !== undefined && object3D instanceof THREE.PointLight) {
            object3D.distance = obj.userData.light.distance;
          }
        }
      }
    }
  }
  
  // Recursively sync children
  if (obj.children && obj.children.length > 0) {
    obj.children.forEach(child => {
      syncObjectToScene(child, scene, objectsRef);
    });
  }
};

// Sync all objects from store to scene
export const syncObjectsToScene = (
  scene: THREE.Scene, 
  objects: ThreeDObject[], 
  objectsRef: Map<string, THREE.Object3D>
) => {
  if (!scene) return;
  
  // Track current objects to detect removals
  const currentIds = new Set<string>();
  
  // Sync each object from store to scene
  objects.forEach(obj => {
    syncObjectToScene(obj, scene, objectsRef);
    currentIds.add(obj.id);
  });
  
  // Remove objects that are no longer in the store
  objectsRef.forEach((object3D, id) => {
    if (!currentIds.has(id)) {
      scene.remove(object3D);
      objectsRef.delete(id);
    }
  });
}; 