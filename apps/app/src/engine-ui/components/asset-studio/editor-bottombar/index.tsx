import { useThreeDEditorStore, CameraType } from "@/store/three-editor-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Eye, Grid, Ruler, Camera, ChevronsUpDown } from "lucide-react";

export default function Bottombar() {
  const { cameraType, setCameraType } = useThreeDEditorStore();

  const handleCameraChange = (type: CameraType) => {
    setCameraType(type);
  };

  return (
    <div className="flex items-center justify-between h-full px-2 text-xs">
      <div className="flex items-center space-x-3">
        {/* Camera Controls */}
        <div className="flex items-center space-x-1">
          <span className="text-zinc-400">Camera:</span>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 px-2 rounded-md ${cameraType === 'perspective' ? 'bg-green-900/20 text-green-400' : ''}`}
            onClick={() => handleCameraChange("perspective")}
          >
            <Camera className="h-3 w-3 mr-1" />
            Perspective
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 px-2 rounded-md ${cameraType === 'orthographic' ? 'bg-green-900/20 text-green-400' : ''}`}
            onClick={() => handleCameraChange("orthographic")}
          >
            <ChevronsUpDown className="h-3 w-3 mr-1" />
            Orthographic
          </Button>
        </div>

        <Separator orientation="vertical" className="h-4 bg-zinc-800" />

        {/* Grid Controls - Will be fully implemented later */}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 rounded-md"
          >
            <Grid className="h-3 w-3 mr-1" />
            Grid
          </Button>
        </div>

        <Separator orientation="vertical" className="h-4 bg-zinc-800" />

        {/* Measurement Controls - Will be fully implemented later */}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 rounded-md"
          >
            <Ruler className="h-3 w-3 mr-1" />
            Measure
          </Button>
        </div>
      </div>
      
      {/* Right side controls */}
      <div className="flex items-center space-x-2">
        {/* Visibility Controls - Will be fully implemented later */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-md"
          title="Toggle Shadows"
        >
          <Eye className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
} 