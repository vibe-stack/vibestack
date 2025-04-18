import { useThreeDEditorStore, ThreeDObject } from "@/store/three-editor-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Pointer,
  Square,
  Lamp,
  Sun,
  Plus,
  Undo,
  Redo,
  Box,
  Circle,
  Cylinder as CylinderIcon,
  Trash,
  Move,
  RotateCcw,
  Maximize,
  Pencil,
} from "lucide-react";
import * as THREE from "three";

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
    undo,
    redo,
    removeObject,
    selectedObjectId,
  } = useThreeDEditorStore();

  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
    if (tool === "translate" || tool === "rotate" || tool === "scale") {
      onTransformModeChange?.(tool);
    }
  };

  const extractVertices = (geometry: THREE.BufferGeometry): [number, number, number][] => {
    const posAttr = geometry.getAttribute("position");
    if (!posAttr) return [];
    const vertices: [number, number, number][] = [];
    for (let i = 0; i < posAttr.count; i++) {
      vertices.push([posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i)]);
    }
    return vertices;
  };

  function createNewObject(objectType: string): Partial<ThreeDObject> {
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
        const vertices = extractVertices(boxGeom);
        return {
          ...base,
          userData: {
            geometry: {
              type: "box",
              parameters: {
                width: 1,
                height: 1,
                depth: 1,
                widthSegments: 1,
                heightSegments: 1,
                depthSegments: 1,
                vertices,
              },
            },
            material: { type: "standard", color: "#22c55e" },
          },
        };
      }
      case "sphere": {
        const radius = 0.5;
        const widthSegments = 16;
        const heightSegments = 12;
        const sphereGeom = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
        const vertices = extractVertices(sphereGeom);
        return {
          ...base,
          userData: {
            geometry: {
              type: "sphere",
              parameters: {
                radius,
                widthSegments,
                heightSegments,
                vertices,
              },
            },
            material: { type: "standard", color: "#22c55e" },
          },
        };
      }
      case "cylinder": {
        const radius = 0.5;
        const height = 1;
        const radialSegments = 16;
        const cylinderGeom = new THREE.CylinderGeometry(radius, radius, height, radialSegments);
        const vertices = extractVertices(cylinderGeom);
        return {
          ...base,
          userData: {
            geometry: {
              type: "cylinder",
              parameters: {
                radius,
                height,
                radialSegments,
                vertices,
              },
            },
            material: { type: "standard", color: "#22c55e" },
          },
        };
      }
      case "plane": {
        const width = 1;
        const height = 1;
        const widthSegments = 1;
        const heightSegments = 1;
        const planeGeom = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
        const vertices = extractVertices(planeGeom);
        return {
          ...base,
          userData: {
            geometry: {
              type: "plane",
              parameters: {
                width,
                height,
                widthSegments,
                heightSegments,
                vertices,
              },
            },
            material: { type: "standard", color: "#22c55e" },
          },
        };
      }
      case "pointLight":
        return {
          ...base,
          type: "light",
          name: "Point Light",
          userData: {
            light: {
              color: "#ffffff",
              intensity: 1,
              distance: 0,
              castShadow: true,
            },
          },
        };
      case "directionalLight":
        return {
          ...base,
          type: "light",
          name: "Directional Light",
          userData: {
            light: {
              color: "#ffffff",
              intensity: 1,
              castShadow: true,
            },
          },
        };
      default:
        return base;
    }
  }

  const handleAddObject = (objectType: string) => {
    const newObject = createNewObject(objectType);
    addObject(newObject);
  };

  const handleDeleteObject = () => {
    if (selectedObjectId) {
      removeObject(selectedObjectId);
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

        {/* Edit button */}
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

        {/* Transform tools */}
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

        {/* Edit mode toggles or quick add items */}
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
        ) : (
          <>
            {/* Basic shapes */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-md ${activeTool === "cube" ? "bg-green-900/20 text-green-400" : ""}`}
              onClick={() => {
                handleToolChange("cube");
                handleAddObject("cube");
              }}
              title="Add Cube"
            >
              <Box className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-md ${activeTool === "sphere" ? "bg-green-900/20 text-green-400" : ""}`}
              onClick={() => {
                handleToolChange("sphere");
                handleAddObject("sphere");
              }}
              title="Add Sphere"
            >
              <Circle className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-md ${activeTool === "cylinder" ? "bg-green-900/20 text-green-400" : ""}`}
              onClick={() => {
                handleToolChange("cylinder");
                handleAddObject("cylinder");
              }}
              title="Add Cylinder"
            >
              <CylinderIcon className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-md ${activeTool === "plane" ? "bg-green-900/20 text-green-400" : ""}`}
              onClick={() => {
                handleToolChange("plane");
                handleAddObject("plane");
              }}
              title="Add Plane"
            >
              <Square className="h-4 w-4" />
            </Button>

            <Separator
              orientation="vertical"
              className="h-5 mx-1 bg-zinc-800"
            />

            {/* Lights */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-md ${activeTool === "pointLight" ? "bg-green-900/20 text-green-400" : ""}`}
              onClick={() => {
                handleToolChange("pointLight");
                handleAddObject("pointLight");
              }}
              title="Add Point Light"
            >
              <Lamp className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-md ${activeTool === "directionalLight" ? "bg-green-900/20 text-green-400" : ""}`}
              onClick={() => {
                handleToolChange("directionalLight");
                handleAddObject("directionalLight");
              }}
              title="Add Directional Light"
            >
              <Sun className="h-4 w-4" />
            </Button>
          </>
        )}

        <Separator orientation="vertical" className="h-5 mx-1 bg-zinc-800" />

        {/* Other controls */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-md"
          onClick={() => {
            // Add complex object dropdown will be implemented here
          }}
          title="Add More Objects"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="ml-auto flex items-center space-x-1">
        {/* Delete button (only enabled when an object is selected) */}
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 rounded-md ${!selectedObjectId ? "opacity-50 cursor-not-allowed" : "hover:bg-red-900/20 hover:text-red-400"}`}
          onClick={handleDeleteObject}
          disabled={!selectedObjectId}
          title="Delete Selected Object (Del)"
        >
          <Trash className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-5 mx-1 bg-zinc-800" />

        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-md"
          onClick={() => undo()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-md"
          onClick={() => redo()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
