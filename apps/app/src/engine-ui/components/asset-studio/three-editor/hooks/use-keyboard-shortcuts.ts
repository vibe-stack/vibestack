import { useEffect } from "react";
import { useThreeDEditorStore } from "@/store/three-editor-store";
import { TransformMode } from "./use-transform-controls";

// Custom hook for handling keyboard shortcuts
export const useKeyboardShortcuts = (
  isInitialized: boolean, // Keep for API compatibility, not needed with R3F
  setTransformControlsMode: (mode: TransformMode) => void
) => {
  const { selectedObjectId, selectObject, removeObject } = useThreeDEditorStore();
  
  useEffect(() => {
    // Set up keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if typing in an input field
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (event.key.toLowerCase()) {
        case 'delete':
        case 'backspace':
          // Delete selected object
          if (selectedObjectId) {
            removeObject(selectedObjectId);
          }
          break;
        case 'g':
          // Grab (translate)
          setTransformControlsMode('translate');
          break;
        case 'r':
          // Rotate
          setTransformControlsMode('rotate');
          break;
        case 's':
          // Scale
          setTransformControlsMode('scale');
          break;
        case 'escape':
          // Deselect
          selectObject(null);
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedObjectId, selectObject, removeObject, setTransformControlsMode]);
}; 