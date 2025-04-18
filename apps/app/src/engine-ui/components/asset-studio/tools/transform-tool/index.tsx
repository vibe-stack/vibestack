import { useThreeDEditorStore } from "@/store/three-editor-store"
import { useEffect } from "react"
import { useThree } from "@react-three/fiber"
import { useState } from "react"
import { TransformControls } from "@react-three/drei"
import { TransformMode } from "@/engine-ui/components/asset-studio/three-editor/hooks/use-transform-controls"
import { useKeyboardShortcuts } from "@/engine-ui/components/asset-studio/three-editor/hooks/use-keyboard-shortcuts"
import { Object3D } from "three"

export function TransformTool({ transformMode, setTransformControlsMode }: { transformMode: TransformMode, setTransformControlsMode: (mode: TransformMode) => void }) {
  const { selectedObjectId, updateObject } = useThreeDEditorStore()
  const [target, setTarget] = useState<Object3D | null>(null)
  const { scene } = useThree()

  // Find selected object in scene
  useEffect(() => {
    if (!selectedObjectId || !scene) {
      setTarget(null)
      return
    }
    const frame = requestAnimationFrame(() => {
      const object = scene.getObjectByName(selectedObjectId)
      setTarget(object || null)
    })
    return () => cancelAnimationFrame(frame)
  }, [selectedObjectId, scene])

  // Set up keyboard shortcuts
  useKeyboardShortcuts(true, setTransformControlsMode)

  // Sync transform changes to Zustand store
  const handleObjectChange = () => {
    if (!target || !selectedObjectId) return
    updateObject(selectedObjectId, {
      position: target.position.clone(),
      rotation: target.rotation.clone(),
      scale: target.scale.clone(),
    })
  }

  return target ? (
    <TransformControls 
      object={target} 
      mode={transformMode}
      size={0.75}
      onObjectChange={handleObjectChange}
    />
  ) : null
}