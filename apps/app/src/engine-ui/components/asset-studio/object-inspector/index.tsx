import { useState } from "react";
import { useThreeDEditorStore } from "@/store/three-editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight } from "lucide-react";
import * as THREE from "three";
import { Slider } from "@/components/ui/slider";

function ButtonGroup({ value, options, onChange }: { value: string, options: { label: string, value: string }[], onChange: (v: string) => void }) {
  return (
    <div className="inline-flex rounded-md bg-zinc-900/30 border border-green-900/10">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`px-2 h-7 text-xs rounded-md transition-colors ${value === opt.value ? "bg-green-900/30 text-green-400" : "text-zinc-300 hover:bg-zinc-800/30"}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function Inspector() {
  const { selectedObjectId, objects, updateObject } = useThreeDEditorStore();
  const [sections, setSections] = useState({
    transform: true,
    material: true,
    geometry: true,
    visibility: true,
    shadow: true,
  });

  // Find the selected object
  const selectedObject = objects.find(obj => obj.id === selectedObjectId);

  const toggleSection = (section: keyof typeof sections) => {
    setSections({
      ...sections,
      [section]: !sections[section],
    });
  };

  // Handler for updating position
  const handlePositionChange = (axis: "x" | "y" | "z", value: string) => {
    if (!selectedObject) return;
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return;
    const newPosition = new THREE.Vector3().copy(selectedObject.position);
    newPosition[axis] = numericValue;
    updateObject(selectedObject.id, { position: newPosition });
  };

  // Handler for updating rotation
  const handleRotationChange = (axis: "x" | "y" | "z", value: string) => {
    if (!selectedObject) return;
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return;
    const newRotation = new THREE.Euler().copy(selectedObject.rotation);
    newRotation[axis] = (numericValue * Math.PI) / 180; // Convert to radians
    updateObject(selectedObject.id, { rotation: newRotation });
  };

  // Handler for updating scale
  const handleScaleChange = (axis: "x" | "y" | "z", value: string) => {
    if (!selectedObject) return;
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue <= 0) return;
    const newScale = new THREE.Vector3().copy(selectedObject.scale);
    newScale[axis] = numericValue;
    updateObject(selectedObject.id, { scale: newScale });
  };

  // Handler for updating name
  const handleNameChange = (name: string) => {
    if (!selectedObject) return;
    updateObject(selectedObject.id, { name });
  };

  // Handler for updating material properties
  const handleMaterialChange = (property: string, value: unknown) => {
    if (!selectedObject) return;
    const userData = { ...selectedObject.userData };
    if (!userData.material) {
      userData.material = { type: "standard" };
    }
    userData.material = {
      ...userData.material,
      [property]: value,
    };
    updateObject(selectedObject.id, { userData });
    };
    
  // Handler for updating user data
  const handleUserDataChange = (property: string, value: unknown) => {
    if (!selectedObject) return;
    const userData = { ...selectedObject.userData, [property]: value };
    updateObject(selectedObject.id, { userData });
  };

  // If no object is selected, show a message
  if (!selectedObject) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400">
        Select an object to inspect
      </div>
    );
  }

  // Convert rotation from radians to degrees for UI
  const rotationDegrees = {
    x: (selectedObject.rotation.x * 180) / Math.PI,
    y: (selectedObject.rotation.y * 180) / Math.PI,
    z: (selectedObject.rotation.z * 180) / Math.PI,
  };

  // Material UI logic
  const mat = selectedObject.userData.material || { type: "standard" };
  const matType = mat.type || "standard";
  // Only show relevant controls for each material type
  const showColor = ["standard", "basic", "phong", "lambert"].includes(matType);
  const showWireframe = ["standard", "basic", "phong", "lambert", "normal"].includes(matType);
  const showShading = ["standard", "basic", "phong", "lambert"].includes(matType);
  const showSide = ["standard", "basic", "phong", "lambert", "normal"].includes(matType);

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4 min-w-0">
        <div className="space-y-2">
            <Label htmlFor="object-name" className="text-xs font-medium text-zinc-300">
              Name
            </Label>
          <Input 
            id="object-name" 
            value={selectedObject.name} 
            onChange={(e) => handleNameChange(e.target.value)}
            className="h-7 bg-zinc-900/30 border border-green-900/10 rounded-lg text-xs focus:ring-1 focus:ring-green-400/20" 
          />
        </div>
        <Separator className="bg-zinc-800/30" />
        {/* Transform Section - Figma style */}
        <div className="space-y-3">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection("transform")}> 
            <div className="flex items-center">
              {sections.transform ? (
                <ChevronDown className="h-3 w-3 mr-1 opacity-70" />
              ) : (
                <ChevronRight className="h-3 w-3 mr-1 opacity-70" />
              )}
              <Label className="text-xs font-semibold text-green-200">Transform</Label>
            </div>
          </div>
          {sections.transform && (
            <div className="space-y-2 pl-1">
              {/* Position row */}
              <div>
                <div className="flex items-center mb-1">
                  <span className="text-xs text-zinc-400 w-14">Position</span>
                  <div className="flex gap-1 flex-1">
                <Input 
                  value={selectedObject.position.x.toFixed(2)} 
                      onChange={e => handlePositionChange("x", e.target.value)}
                      className="h-7 w-16 text-xs bg-zinc-900/30 border border-green-900/10 rounded-md text-center focus:ring-1 focus:ring-green-400/20"
                      aria-label="Position X"
                />
                <Input 
                  value={selectedObject.position.y.toFixed(2)} 
                      onChange={e => handlePositionChange("y", e.target.value)}
                      className="h-7 w-16 text-xs bg-zinc-900/30 border border-green-900/10 rounded-md text-center focus:ring-1 focus:ring-green-400/20"
                      aria-label="Position Y"
                />
                <Input 
                  value={selectedObject.position.z.toFixed(2)} 
                      onChange={e => handlePositionChange("z", e.target.value)}
                      className="h-7 w-16 text-xs bg-zinc-900/30 border border-green-900/10 rounded-md text-center focus:ring-1 focus:ring-green-400/20"
                      aria-label="Position Z"
                />
                  </div>
                </div>
              </div>
              {/* Rotation row */}
              <div>
                <div className="flex items-center mb-1">
                  <span className="text-xs text-zinc-400 w-14">Rotation</span>
                  <div className="flex gap-1 flex-1">
                <Input 
                  value={rotationDegrees.x.toFixed(2)} 
                      onChange={e => handleRotationChange("x", e.target.value)}
                      className="h-7 w-16 text-xs bg-zinc-900/30 border border-green-900/10 rounded-md text-center focus:ring-1 focus:ring-green-400/20"
                      aria-label="Rotation X"
                />
                <Input 
                  value={rotationDegrees.y.toFixed(2)} 
                      onChange={e => handleRotationChange("y", e.target.value)}
                      className="h-7 w-16 text-xs bg-zinc-900/30 border border-green-900/10 rounded-md text-center focus:ring-1 focus:ring-green-400/20"
                      aria-label="Rotation Y"
                />
                <Input 
                  value={rotationDegrees.z.toFixed(2)} 
                      onChange={e => handleRotationChange("z", e.target.value)}
                      className="h-7 w-16 text-xs bg-zinc-900/30 border border-green-900/10 rounded-md text-center focus:ring-1 focus:ring-green-400/20"
                      aria-label="Rotation Z"
                />
                  </div>
                </div>
              </div>
              {/* Scale row */}
              <div>
                <div className="flex items-center mb-1">
                  <span className="text-xs text-zinc-400 w-14">Scale</span>
                  <div className="flex gap-1 flex-1">
                <Input 
                  value={selectedObject.scale.x.toFixed(2)} 
                      onChange={e => handleScaleChange("x", e.target.value)}
                      className="h-7 w-16 text-xs bg-zinc-900/30 border border-green-900/10 rounded-md text-center focus:ring-1 focus:ring-green-400/20"
                      aria-label="Scale X"
                />
                <Input 
                  value={selectedObject.scale.y.toFixed(2)} 
                      onChange={e => handleScaleChange("y", e.target.value)}
                      className="h-7 w-16 text-xs bg-zinc-900/30 border border-green-900/10 rounded-md text-center focus:ring-1 focus:ring-green-400/20"
                      aria-label="Scale Y"
                />
                <Input 
                  value={selectedObject.scale.z.toFixed(2)} 
                      onChange={e => handleScaleChange("z", e.target.value)}
                      className="h-7 w-16 text-xs bg-zinc-900/30 border border-green-900/10 rounded-md text-center focus:ring-1 focus:ring-green-400/20"
                      aria-label="Scale Z"
                />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <Separator className="bg-zinc-800/30" />
        {/* Material Section */}
        <div className="space-y-3">
          <div 
            className="flex items-center justify-between cursor-pointer" 
            onClick={() => toggleSection("material")}
          >
            <div className="flex items-center">
              {sections.material ? (
                <ChevronDown className="h-3 w-3 mr-1 opacity-70" />
              ) : (
                <ChevronRight className="h-3 w-3 mr-1 opacity-70" />
              )}
              <Label className="text-xs font-semibold text-green-200">Material</Label>
            </div>
          </div>

          {sections.material && (
            <div className="space-y-3 pl-0">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between w-full">
                  <Label htmlFor="material-type" className="text-xs text-zinc-400 min-w-[80px]">Type</Label>
                  <select
                    id="material-type"
                    value={matType}
                    onChange={e => handleMaterialChange("type", e.target.value)}
                    className="h-7 bg-zinc-900/30 border border-green-900/10 rounded-lg text-xs px-2 w-full max-w-[180px]"
                  >
                    <option value="standard">Standard</option>
                    <option value="basic">Basic</option>
                    <option value="phong">Phong</option>
                    <option value="lambert">Lambert</option>
                    <option value="normal">Normal</option>
                  </select>
                </div>
                {showColor && (
                  <div className="flex items-center justify-between w-full gap-2">
                    <Label htmlFor="material-color" className="text-xs text-zinc-400 min-w-[80px]">Color</Label>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="color"
                        id="material-color"
                        value={mat.color || "#22c55e"}
                        onChange={e => handleMaterialChange("color", e.target.value)}
                        className="h-7 w-7 border-0 p-0 rounded"
                      />
                      <Input
                        value={mat.color || "#22c55e"}
                        onChange={e => handleMaterialChange("color", e.target.value)}
                        className="h-7 bg-zinc-900/30 border border-green-900/10 rounded-lg text-xs flex-1 focus:ring-1 focus:ring-green-400/20"
                      />
                    </div>
                  </div>
                )}
                {matType === "standard" && (
                  <>
                    <div className="flex items-center justify-between w-full gap-2">
                      <Label htmlFor="material-emissive" className="text-xs text-zinc-400 min-w-[80px]">Emissive</Label>
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="color"
                          id="material-emissive"
                          value={('emissive' in mat && typeof mat.emissive === 'string') ? mat.emissive : "#000000"}
                          onChange={e => handleMaterialChange("emissive", e.target.value)}
                          className="h-7 w-7 border-0 p-0 rounded"
                        />
                        <Input
                          value={('emissive' in mat && typeof mat.emissive === 'string') ? mat.emissive : "#000000"}
                          onChange={e => handleMaterialChange("emissive", e.target.value)}
                          className="h-7 bg-zinc-900/30 border border-green-900/10 rounded-lg text-xs flex-1 focus:ring-1 focus:ring-green-400/20"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full gap-2">
                      <Label htmlFor="material-emissive-intensity" className="text-xs text-zinc-400 min-w-[80px]">Emissive Intensity</Label>
                      <div className="flex items-center gap-2 flex-1">
                        <Slider
                          min={0}
                          max={1}
                          step={0.01}
                          value={[('emissiveIntensity' in mat && typeof mat.emissiveIntensity === 'number') ? mat.emissiveIntensity : 1]}
                          onValueChange={v => handleMaterialChange("emissiveIntensity", v[0])}
                          className="w-32"
                        />
                        <Input
                          type="number"
                          min={0}
                          max={1}
                          step={0.01}
                          value={('emissiveIntensity' in mat && typeof mat.emissiveIntensity === 'number') ? mat.emissiveIntensity : 1}
                          onChange={e => handleMaterialChange("emissiveIntensity", parseFloat(e.target.value))}
                          className="h-7 w-14 text-xs bg-zinc-900/30 border border-green-900/10 rounded-md text-center"
                        />
                      </div>
                    </div>
                  </>
                )}
                {showWireframe && (
                  <div className="flex items-center justify-between w-full gap-2">
                    <Label className="text-xs text-zinc-400 min-w-[80px]">Wireframe</Label>
                    <ButtonGroup
                      value={mat.wireframe ? "yes" : "no"}
                      options={[
                        { label: "Yes", value: "yes" },
                        { label: "No", value: "no" },
                      ]}
                      onChange={v => handleMaterialChange("wireframe", v === "yes")}
                    />
                  </div>
                )}
                {showShading && (
                  <div className="flex items-center justify-between w-full gap-2">
                    <Label className="text-xs text-zinc-400 min-w-[80px]">Shading</Label>
                    <ButtonGroup
                      value={mat.flatShading ? "flat" : "smooth"}
                      options={[
                        { label: "Flat", value: "flat" },
                        { label: "Smooth", value: "smooth" },
                      ]}
                      onChange={v => handleMaterialChange("flatShading", v === "flat")}
                    />
                  </div>
                )}
                {showSide && (
                  <div className="flex items-center justify-between w-full gap-2">
                    <Label htmlFor="material-side" className="text-xs text-zinc-400 min-w-[80px]">Sides</Label>
                    <select
                      id="material-side"
                      value={mat.side || "front"}
                      onChange={e => handleMaterialChange("side", e.target.value)}
                      className="h-7 bg-zinc-900/30 border border-green-900/10 rounded-lg text-xs px-2 w-full max-w-[120px]"
                    >
                      <option value="front">Front</option>
                      <option value="back">Back</option>
                      <option value="double">Double</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator className="bg-zinc-800/30" />

        {/* Visibility Section */}
        <div className="space-y-3">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection("visibility")}
          >
            <div className="flex items-center">
              {sections.visibility ? (
                <ChevronDown className="h-3 w-3 mr-1 opacity-70" />
              ) : (
                <ChevronRight className="h-3 w-3 mr-1 opacity-70" />
              )}
              <Label className="text-xs font-semibold text-green-200">Visibility</Label>
            </div>
          </div>
          {sections.visibility && (
            <div className="pl-4">
              <div className="flex items-center justify-between w-full gap-2">
                <Label className="text-xs text-zinc-400 min-w-[80px]">Visibility</Label>
                <ButtonGroup
                  value={selectedObject.visible ? "yes" : "no"}
                  options={[
                    { label: "Yes", value: "yes" },
                    { label: "No", value: "no" },
                  ]}
                  onChange={v => updateObject(selectedObject.id, { visible: v === "yes" })}
                />
              </div>
            </div>
          )}
        </div>

        <Separator className="bg-zinc-800/30" />

        {/* Shadow Section */}
        <div className="space-y-3">
          <div 
            className="flex items-center justify-between cursor-pointer" 
            onClick={() => toggleSection("shadow")}
          >
            <div className="flex items-center">
              {sections.shadow ? (
                <ChevronDown className="h-3 w-3 mr-1 opacity-70" />
              ) : (
                <ChevronRight className="h-3 w-3 mr-1 opacity-70" />
              )}
              <Label className="text-xs font-semibold text-green-200">Shadow</Label>
            </div>
          </div>

          {sections.shadow && (
            <div className="space-y-3 pl-4">
              <div className="flex items-center justify-between w-full gap-2">
                <Label className="text-xs text-zinc-400 min-w-[80px]">Cast Shadow</Label>
                <ButtonGroup
                  value={selectedObject.userData.castShadow ? "yes" : "no"}
                  options={[
                    { label: "Yes", value: "yes" },
                    { label: "No", value: "no" },
                  ]}
                  onChange={v => handleUserDataChange("castShadow", v === "yes")}
                />
              </div>
              <div className="flex items-center justify-between w-full gap-2">
                <Label className="text-xs text-zinc-400 min-w-[80px]">Receive Shadow</Label>
                <ButtonGroup
                  value={selectedObject.userData.receiveShadow ? "yes" : "no"}
                  options={[
                    { label: "Yes", value: "yes" },
                    { label: "No", value: "no" },
                  ]}
                  onChange={v => handleUserDataChange("receiveShadow", v === "yes")}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
} 