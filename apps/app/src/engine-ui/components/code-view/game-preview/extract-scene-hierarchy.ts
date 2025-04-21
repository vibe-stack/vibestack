import { SceneNode } from "@/store/scene-hierarchy-store";

interface IframeSceneNode {
  id: string;
  name: string;
  type: string;
  children?: IframeSceneNode[];
}

interface IframeWindow extends Window {
  currentScene?: {
    id?: string;
    name?: string;
    type?: string;
    children?: IframeSceneNode[];
  };
  // THREE.js scene objects
  THREE?: {
    Scene?: unknown;
    Object3D?: unknown;
  };
}

export function extractSceneHierarchy(iframeEl: HTMLIFrameElement | null): SceneNode[] {
  if (!iframeEl || !iframeEl.contentWindow) {
    console.log("Cannot extract scene hierarchy: No iframe element or content window");
    return [];
  }

  try {
    const iframeWindow = iframeEl.contentWindow as IframeWindow;
    
    // First try to get the explicitly exposed currentScene
    const currentScene = iframeWindow.currentScene;
    
    // If no currentScene is found, try to look for a THREE.Scene instance
    if (!currentScene && iframeWindow.THREE) {
      // Log available global variables for debugging
      if (typeof iframeWindow.THREE === 'object') {
        console.log("THREE found in iframe, but no currentScene");
      }
    }
    
    if (!currentScene) {
      // Create a placeholder scene if none is available yet
      // This will show something in the UI while the game is initializing
      return [{
        id: "scene_placeholder",
        name: "Loading Scene...",
        type: "Scene",
        expanded: true,
        children: []
      }];
    }

    // Convert the scene structure to our SceneNode format
    const convertNode = (node: IframeSceneNode): SceneNode => {
      return {
        id: node.id || `node_${Math.random().toString(36).substr(2, 9)}`,
        name: node.name || node.type || "Unknown",
        type: node.type || "Unknown",
        expanded: true,
        children: node.children?.map(convertNode) || []
      };
    };

    // Build the hierarchy starting from the root node
    const sceneNode = {
      id: currentScene.id || "scene_root",
      name: currentScene.name || "Main Scene",
      type: "Scene",
      children: currentScene.children || []
    };

    return [convertNode(sceneNode)];
  } catch (error) {
    console.error("Error extracting scene hierarchy:", error);
    return [{
      id: "scene_error",
      name: "Scene Error",
      type: "Error",
      expanded: true,
      children: [{
        id: "error_details",
        name: error instanceof Error ? error.message : String(error),
        type: "ErrorDetails",
        expanded: true
      }]
    }];
  }
} 