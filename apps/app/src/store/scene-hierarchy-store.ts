import { create } from "zustand";

export interface SceneNode {
  id: string;
  name: string;
  type: string;
  children?: SceneNode[];
  expanded?: boolean;
}

interface SceneHierarchyState {
  sceneNodes: SceneNode[];
  selectedNodeId: string | null;
}

interface SceneHierarchyActions {
  setSceneNodes: (nodes: SceneNode[]) => void;
  setSelectedNode: (nodeId: string | null) => void;
  toggleNodeExpanded: (nodeId: string) => void;
}

export type SceneHierarchyStore = SceneHierarchyState & SceneHierarchyActions;

export const useSceneHierarchyStore = create<SceneHierarchyStore>()((set) => ({
  sceneNodes: [],
  selectedNodeId: null,

  setSceneNodes: (nodes) => set({ sceneNodes: nodes }),
  
  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),
  
  toggleNodeExpanded: (nodeId) => set((state) => {
    const updateNodes = (nodes: SceneNode[]): SceneNode[] => {
      return nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: updateNodes(node.children) };
        }
        return node;
      });
    };

    return {
      sceneNodes: updateNodes(state.sceneNodes),
    };
  }),
})); 