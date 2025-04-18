import { useThreeDEditorStore } from "@/store/three-editor-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Pointer,
  Square,
  Box,
  Circle,
  Cylinder as CylinderIcon,
  Move,
  RotateCcw,
  Maximize,
  Pencil,
} from "lucide-react";
import * as THREE from "three";
import { MeshTopology, Vertex, Edge, Face } from "../tools/mesh-topology";

// Define tool types
type ToolType =
  | "select"
  | "translate"
  | "rotate"
  | "scale"
  | "cube"
  | "sphere"
  | "cylinder"
  | "plane"
  | "pointLight"
  | "directionalLight";

// Pass transform mode setter as a prop
interface ToolbarProps {
  onTransformModeChange?: (mode: "translate" | "rotate" | "scale") => void;
  canEdit: boolean;
}

export default function Toolbar({
  onTransformModeChange,
  canEdit,
}: ToolbarProps) {
  const {
    isEditing,
    setIsEditing,
    editMode,
    setEditMode,
    activeTool,
    setActiveTool,
    addObject,
  } = useThreeDEditorStore();

  function geometryToMeshTopology(geometry: THREE.BufferGeometry): MeshTopology {
    const posAttr = geometry.getAttribute("position");
    const indexAttr = geometry.getIndex();
    const vertices: Vertex[] = [];
    const edgesSet = new Set<string>();
    const faces: Face[] = [];
    for (let i = 0; i < posAttr.count; i++) {
      vertices.push({ id: `v${i}`, position: [posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i)] });
    }
    if (indexAttr) {
      for (let i = 0; i < indexAttr.count; i += 3) {
        const a = indexAttr.getX(i);
        const b = indexAttr.getX(i + 1);
        const c = indexAttr.getX(i + 2);
        faces.push({ id: `f${i / 3}`, vertexIds: [`v${a}`, `v${b}`, `v${c}`] });
        [[a, b], [b, c], [c, a]].forEach(([v1, v2]) => {
          const key = v1 < v2 ? `${v1}_${v2}` : `${v2}_${v1}`;
          edgesSet.add(key);
        });
      }
    }
    const edges: Edge[] = Array.from(edgesSet).map((key, i) => {
      const [a, b] = key.split("_");
      return { id: `e${i}`, vertexIds: [`v${a}`, `v${b}`] };
    });
    return { vertices, edges, faces };
  }

  function createNewObject(objectType: string) {
    const base = {
      name: objectType.charAt(0).toUpperCase() + objectType.slice(1),
      type: "mesh",
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      visible: true,
      userData: {},
    };
    switch (objectType) {
      case "cube": {
        const boxGeom = new THREE.BoxGeometry(1, 1, 1);
        const meshTopology = geometryToMeshTopology(boxGeom);
        return {
          ...base,
          userData: {
            meshTopology,
            geometry: { type: "box" as const },
            material: { type: "standard" as const, color: "#22c55e" },
          },
        };
      }
      case "sphere": {
        const radius = 0.5;
        const widthSegments = 16;
        const heightSegments = 12;
        const sphereGeom = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
        const meshTopology = geometryToMeshTopology(sphereGeom);
        return {
          ...base,
          userData: {
            meshTopology,
            geometry: { type: "sphere" as const },
            material: { type: "standard" as const, color: "#22c55e" },
          },
        };
      }
      case "cylinder": {
        const radius = 0.5;
        const height = 1;
        const radialSegments = 16;
        const cylinderGeom = new THREE.CylinderGeometry(radius, radius, height, radialSegments);
        const meshTopology = geometryToMeshTopology(cylinderGeom);
        return {
          ...base,
          userData: {
            meshTopology,
            geometry: { type: "cylinder" as const },
            material: { type: "standard" as const, color: "#22c55e" },
          },
        };
      }
      case "plane": {
        const width = 1;
        const height = 1;
        const widthSegments = 1;
        const heightSegments = 1;
        const planeGeom = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
        const meshTopology = geometryToMeshTopology(planeGeom);
        return {
          ...base,
          userData: {
            meshTopology,
            geometry: { type: "plane" as const },
            material: { type: "standard" as const, color: "#22c55e" },
          },
        };
      }
      default:
        return base;
    }
  }

  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
    if (tool === "translate" || tool === "rotate" || tool === "scale") {
      onTransformModeChange?.(tool);
    }
  };

  return (
    <div className="flex items-center h-full px-2">
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 rounded-md ${activeTool === "select" ? "bg-green-900/20 text-green-400" : ""}`}
          onClick={() => handleToolChange("select")}
          title="Select (Esc)"
        >
          <Pointer className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 rounded-md ${activeTool === "cube" ? "bg-green-900/20 text-green-400" : ""}`}
          onClick={() => addObject(createNewObject("cube"))}
          title="Add Cube"
        >
          <Box className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 rounded-md ${activeTool === "sphere" ? "bg-green-900/20 text-green-400" : ""}`}
          onClick={() => addObject(createNewObject("sphere"))}
          title="Add Sphere"
        >
          <Circle className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 rounded-md ${activeTool === "cylinder" ? "bg-green-900/20 text-green-400" : ""}`}
          onClick={() => addObject(createNewObject("cylinder"))}
          title="Add Cylinder"
        >
          <CylinderIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 rounded-md ${activeTool === "plane" ? "bg-green-900/20 text-green-400" : ""}`}
          onClick={() => addObject(createNewObject("plane"))}
          title="Add Plane"
        >
          <Square className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-5 mx-1 bg-zinc-800" />
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 rounded-md ${isEditing ? "bg-green-900/20 text-green-400" : ""}`}
          onClick={() => setIsEditing(!isEditing)}
          title="Edit geometry"
          disabled={!canEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-5 mx-1 bg-zinc-800" />
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 rounded-md ${activeTool === "translate" ? "bg-green-900/20 text-green-400" : ""}`}
          onClick={() => handleToolChange("translate")}
          title="Translate (G)"
        >
          <Move className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 rounded-md ${activeTool === "rotate" ? "bg-green-900/20 text-green-400" : ""}`}
          onClick={() => handleToolChange("rotate")}
          title="Rotate (R)"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 rounded-md ${activeTool === "scale" ? "bg-green-900/20 text-green-400" : ""}`}
          onClick={() => handleToolChange("scale")}
          title="Scale (S)"
        >
          <Maximize className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-5 mx-1 bg-zinc-800" />
        {isEditing && canEdit ? (
          <div className="flex items-center space-x-1">
            <Button
              variant={editMode === "vertex" ? "default" : "ghost"}
              size="sm"
              className={`h-7 px-3 rounded-md ${editMode === "vertex" ? "bg-green-900/20 text-green-400" : ""}`}
              onClick={() => setEditMode("vertex")}
            >
              Vertex
            </Button>
            <Button
              variant={editMode === "edge" ? "default" : "ghost"}
              size="sm"
              className={`h-7 px-3 rounded-md ${editMode === "edge" ? "bg-green-900/20 text-green-400" : ""}`}
              onClick={() => setEditMode("edge")}
            >
              Edge
            </Button>
            <Button
              variant={editMode === "face" ? "default" : "ghost"}
              size="sm"
              className={`h-7 px-3 rounded-md ${editMode === "face" ? "bg-green-900/20 text-green-400" : ""}`}
              onClick={() => setEditMode("face")}
            >
              Face
            </Button>
          </div>
        ) : null}
      </div>
      {/* The rest of the toolbar controls (add, delete, undo, redo, etc.) should follow here, ensure all divs are closed properly */}
    </div>
  );
}