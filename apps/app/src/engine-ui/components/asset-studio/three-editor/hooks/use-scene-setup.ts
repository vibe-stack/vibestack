import { useState, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useThreeDEditorStore } from "@/store/three-editor-store";

// Custom hook for scene setup
export const useSceneSetup = (mountRef: React.RefObject<HTMLDivElement | null>) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [controlsRef, setControlsRef] = useState<OrbitControls | null>(null);
  const { setScene, setPerspectiveCamera, setOrthographicCamera, setCameraType, cameraType } = useThreeDEditorStore();
  
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    
    // Get dimensions
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    
    // Create grid helper
    const gridHelper = new THREE.GridHelper(10, 10, 0x555555, 0x333333);
    scene.add(gridHelper);
    
    // Create axes helper
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);
    
    // Create perspective camera
    const perspectiveCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    perspectiveCamera.position.set(5, 5, 5);
    perspectiveCamera.lookAt(0, 0, 0);
    
    // Create orthographic camera
    const aspectRatio = width / height;
    const orthographicCamera = new THREE.OrthographicCamera(
      -5 * aspectRatio, 5 * aspectRatio, 5, -5, 0.1, 1000
    );
    orthographicCamera.position.set(5, 5, 5);
    orthographicCamera.lookAt(0, 0, 0);
    
    // Set active camera based on store state
    const activeCamera = cameraType === "perspective" ? perspectiveCamera : orthographicCamera;
    
    // Create orbit controls
    const controls = new OrbitControls(activeCamera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    setControlsRef(controls);
    
    // Handle window resize
    const handleResize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      
      // Update camera aspect ratio
      if (perspectiveCamera) {
        perspectiveCamera.aspect = width / height;
        perspectiveCamera.updateProjectionMatrix();
      }
      
      if (orthographicCamera) {
        const aspectRatio = width / height;
        orthographicCamera.left = -5 * aspectRatio;
        orthographicCamera.right = 5 * aspectRatio;
        orthographicCamera.updateProjectionMatrix();
      }
      
      // Update renderer
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);
    
    // Animation loop
    let frameId: number;
    const animate = () => {
      controls.update();
      renderer.render(scene, activeCamera);
      frameId = requestAnimationFrame(animate);
    };
    animate();
    
    // Update store with references
    setScene(scene);
    setPerspectiveCamera(perspectiveCamera);
    setOrthographicCamera(orthographicCamera);
    setCameraType(cameraType);
    
    setIsInitialized(true);
    
    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [cameraType, setCameraType, setPerspectiveCamera, setOrthographicCamera, setScene, mountRef]);
  
  return { isInitialized, controlsRef };
}; 