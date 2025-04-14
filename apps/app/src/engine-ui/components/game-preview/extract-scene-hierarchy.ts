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
}

export function extractSceneHierarchy(iframeEl: HTMLIFrameElement | null): SceneNode[] {
  if (!iframeEl || !iframeEl.contentWindow) {
    return [];
  }

  try {
    // Access the currentScene from the iframe's window object
    const currentScene = (iframeEl.contentWindow as IframeWindow).currentScene;
    
    if (!currentScene) {
      return [];
    }

    // Convert the scene structure to our SceneNode format
    const convertNode = (node: IframeSceneNode): SceneNode => {
      return {
        id: node.id,
        name: node.name,
        type: node.type,
        expanded: true,
        children: node.children?.map(convertNode)
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
    return [];
  }
} 