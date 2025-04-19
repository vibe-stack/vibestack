import { useEffect } from 'react'
import SceneTreePanel from '../components/asset-studio/scene-tree-panel'
import InspectorPanel from '../components/asset-studio/inspector-panel'
import ViewportCanvas from '../components/asset-studio/viewport-canvas'
import { useEditorStore } from '../editor/store'
import { createDefaultScene } from '../model/scene-default'
import ModeToolbar from '../components/asset-studio/mode-toolbar'
import AddObjectBar from '../components/asset-studio/add-object-bar'

export default function AssetStudioView() {
  const scene = useEditorStore((s) => s.scene)
  const setScene = useEditorStore((s) => s.setScene)
  const mode = useEditorStore((s) => s.mode)
  const selection = useEditorStore((s) => s.selection)

  useEffect(() => {
    if (!scene) setScene(createDefaultScene())
  }, [scene, setScene])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Prevent delete if an input, textarea, or contenteditable is focused
      const active = document.activeElement
      if (
        active &&
        ((active.tagName === 'INPUT' && (active as HTMLInputElement).type !== 'checkbox' && (active as HTMLInputElement).type !== 'radio') ||
         active.tagName === 'TEXTAREA' ||
         (active as HTMLElement).isContentEditable)
      ) {
        return
      }
      if (mode === 'object' && selection.objectIds.length > 0 && e.key === 'Backspace') {
        if (!scene) return
        // Prevent deleting the root object
        const rootObjectId = scene.rootObjectId
        const deletableIds = selection.objectIds.filter(id => id !== rootObjectId)
        if (deletableIds.length === 0) return
        const newObjects = { ...scene.objects }
        const newMeshes = { ...scene.meshes }
        for (const id of deletableIds) {
          const obj = scene.objects[id]
          if (obj) {
            if (obj.meshId) delete newMeshes[obj.meshId]
            delete newObjects[id]
          }
        }
        // Remove deleted objects from their parent's children
        for (const id in newObjects) {
          // clone the object before mutating
          const obj = { ...newObjects[id] }
          obj.children = obj.children.filter((cid: string) => !deletableIds.includes(cid))
          newObjects[id] = obj
        }
        setScene({ ...scene, objects: newObjects, meshes: newMeshes })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, selection, scene, setScene])

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex flex-1 w-full">
        <div className="w-64 h-full border-r border-neutral-800 bg-neutral-950">
          <SceneTreePanel />
        </div>
        <div className="flex-1 h-full flex flex-col">
          <div className="flex flex-col items-center" style={{ minHeight: 0 }}>
            <ModeToolbar />
            {mode === 'object' && (
              <div className="mt-2 mb-2 flex justify-center w-full absolute top-10 z-10">
                <AddObjectBar />
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <ViewportCanvas />
          </div>
        </div>
        <div className="w-80 h-full border-l border-neutral-800 bg-neutral-950">
          <InspectorPanel />
        </div>
      </div>
    </div>
  );
} 