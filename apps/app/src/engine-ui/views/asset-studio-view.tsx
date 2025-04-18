import { useEffect } from 'react'
import SceneTreePanel from '../components/asset-studio/scene-tree-panel'
import InspectorPanel from '../components/asset-studio/inspector-panel'
import ViewportCanvas from '../components/asset-studio/viewport-canvas'
import { useEditorStore } from '../editor/store'
import { createDefaultScene } from '../model/scene-default'
import ModeToolbar from '../components/asset-studio/mode-toolbar'

export default function AssetStudioView() {
  const scene = useEditorStore((s) => s.scene)
  const setScene = useEditorStore((s) => s.setScene)

  useEffect(() => {
    if (!scene) setScene(createDefaultScene())
  }, [scene, setScene])

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex flex-1 w-full">
        <div className="w-64 h-full border-r border-neutral-800 bg-neutral-950">
          <SceneTreePanel />
        </div>
        <div className="flex-1 h-full flex flex-col">
          <div className="flex justify-center items-center" style={{ minHeight: 0 }}>
            <ModeToolbar />
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