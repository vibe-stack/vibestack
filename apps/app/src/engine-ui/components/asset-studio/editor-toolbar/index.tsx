import { useThreeDEditorStore, ThreeDObject } from "@/store/three-editor-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
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
  Pencil
} from "lucide-react";
import * as THREE from "three";

// Define tool types
type ToolType = "select" | "translate" | "rotate" | "scale" | "cube" | "sphere" | "cylinder" | "plane" | "pointLight" | "directionalLight";

// Pass transform mode setter as a prop
interface ToolbarProps {
  onTransformModeChange?: (mode: "translate" | "rotate" | "scale") => void;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  editMode: null | 'vertex' | 'edge' | 'face';
  setEditMode: (v: null | 'vertex' | 'edge' | 'face') => void;
  canEdit: boolean;
}

export default function Toolbar({ onTransformModeChange, isEditing, setIsEditing, editMode, setEditMode, canEdit }: ToolbarProps) {
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const { addObject, undo, redo, removeObject, selectedObjectId } = useThreeDEditorStore();

  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
    
    // If a transform tool is selected, notify parent
    if (tool === "translate" || tool === "rotate" || tool === "scale") {
      onTransformModeChange?.(tool);
    }
  };

  const handleAddObject = (objectType: string) => {
    const newObject: Partial<ThreeDObject> = {
      name: objectType.charAt(0).toUpperCase() + objectType.slice(1),
      type: "mesh",
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      visible: true,
      userData: {},
    };

    // Helper function to extract vertices from a THREE.js geometry
    const extractVertices = (geometry: THREE.BufferGeometry): [number, number, number][] => {
      // Ensure we have position attribute
      const posAttr = geometry.getAttribute("position");
      if (!posAttr) {
        console.error("Geometry does not have position attribute");
        return [];
      }
      
      // Extract vertices as [x,y,z] tuples
      const vertices: [number, number, number][] = [];
      for (let i = 0; i < posAttr.count; i++) {
        vertices.push([
          posAttr.getX(i),
          posAttr.getY(i),
          posAttr.getZ(i)
        ]);
      }
      
      // Log the number of vertices being extracted
      console.log(`Extracted ${vertices.length} vertices from geometry`);
      
      return vertices;
    };

    // Configure based on object type
    switch (objectType) {
      case "cube":
        {
          const boxGeom = new THREE.BoxGeometry(1, 1, 1);
          const vertices = extractVertices(boxGeom);
          newObject.userData = {
            geometry: {
              type: "box",
              parameters: { vertices }
            },
            material: { type: "standard", color: "#22c55e" },
          };
        }
        break;
      case "sphere":
        {
          const sphereGeom = new THREE.SphereGeometry(0.5, 16, 12);
          const vertices = extractVertices(sphereGeom);
          newObject.userData = {
            geometry: {
              type: "sphere",
              parameters: { vertices }
            },
            material: { type: "standard", color: "#22c55e" },
          };
        }
        break;
      case "cylinder":
        {
          const cylinderGeom = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
          const vertices = extractVertices(cylinderGeom);
          newObject.userData = {
            geometry: {
              type: "cylinder",
              parameters: { vertices }
            },
            material: { type: "standard", color: "#22c55e" },
          };
        }
        break;
      case "plane":
        {
          const planeGeom = new THREE.PlaneGeometry(1, 1);
          const vertices = extractVertices(planeGeom);
          newObject.userData = {
            geometry: {
              type: "plane",
              parameters: { vertices }
            },
            material: { type: "standard", color: "#22c55e" },
          };
        }
        break;
      case "pointLight":
        newObject.type = "light";
        newObject.name = "Point Light";
        newObject.userData = {
          light: {
            color: "#ffffff",
            intensity: 1,
            distance: 0,
            castShadow: true
          }
        };
        break;
      case "directionalLight":
        newObject.type = "light";
        newObject.name = "Directional Light";
        newObject.userData = {
          light: {
            color: "#ffffff",
            intensity: 1,
            castShadow: true
          }
        };
        break;
      default:
        break;
    }

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
          className={`h-7 w-7 rounded-md ${activeTool === 'select' ? 'bg-green-900/20 text-green-400' : ''}`}
          onClick={() => handleToolChange("select")}
          title="Select (Esc)"
        >
          <Pointer className="h-4 w-4" />
        </Button>

        {/* Edit button */}
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 rounded-md ${isEditing ? 'bg-green-900/20 text-green-400' : ''}`}
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
          className={`h-7 w-7 rounded-md ${activeTool === 'translate' ? 'bg-green-900/20 text-green-400' : ''}`}
          onClick={() => handleToolChange("translate")}
          title="Translate (G)"
        >
          <Move className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 rounded-md ${activeTool === 'rotate' ? 'bg-green-900/20 text-green-400' : ''}`}
          onClick={() => handleToolChange("rotate")}
          title="Rotate (R)"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 rounded-md ${activeTool === 'scale' ? 'bg-green-900/20 text-green-400' : ''}`}
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
              variant={editMode === 'vertex' ? 'default' : 'ghost'}
              size="sm"
              className={`h-7 px-3 rounded-md ${editMode === 'vertex' ? 'bg-green-900/20 text-green-400' : ''}`}
              onClick={() => setEditMode('vertex')}
            >
              Vertex
            </Button>
            <Button
              variant={editMode === 'edge' ? 'default' : 'ghost'}
              size="sm"
              className={`h-7 px-3 rounded-md ${editMode === 'edge' ? 'bg-green-900/20 text-green-400' : ''}`}
              onClick={() => setEditMode('edge')}
            >
              Edge
            </Button>
            <Button
              variant={editMode === 'face' ? 'default' : 'ghost'}
              size="sm"
              className={`h-7 px-3 rounded-md ${editMode === 'face' ? 'bg-green-900/20 text-green-400' : ''}`}
              onClick={() => setEditMode('face')}
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
              className={`h-7 w-7 rounded-md ${activeTool === 'cube' ? 'bg-green-900/20 text-green-400' : ''}`}
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
              className={`h-7 w-7 rounded-md ${activeTool === 'sphere' ? 'bg-green-900/20 text-green-400' : ''}`}
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
              className={`h-7 w-7 rounded-md ${activeTool === 'cylinder' ? 'bg-green-900/20 text-green-400' : ''}`}
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
              className={`h-7 w-7 rounded-md ${activeTool === 'plane' ? 'bg-green-900/20 text-green-400' : ''}`}
              onClick={() => {
                handleToolChange("plane");
                handleAddObject("plane");
              }}
              title="Add Plane"
            >
              <Square className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-5 mx-1 bg-zinc-800" />

            {/* Lights */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-md ${activeTool === 'pointLight' ? 'bg-green-900/20 text-green-400' : ''}`}
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
              className={`h-7 w-7 rounded-md ${activeTool === 'directionalLight' ? 'bg-green-900/20 text-green-400' : ''}`}
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
          className={`h-7 w-7 rounded-md ${!selectedObjectId ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-900/20 hover:text-red-400'}`}
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