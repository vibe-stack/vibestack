import { useEditorStore } from '@/engine-ui/editor/store'
import { SelectableMesh } from './selectable-mesh'
import { useMemo } from 'react'

export default function UnselectedMeshes() {
  const scene = useEditorStore((s) => s.scene)
  const selection = useEditorStore((s) => s.selection)
  const mode = useEditorStore((s) => s.mode)
  const meshes = useMemo(() => {
    if (!scene) return []
    const excludeId = mode === 'object' && selection.objectIds.length === 1 ? selection.objectIds[0] : null
    return Object.entries(scene.objects)
      .filter(([, obj]) => obj.type === 'mesh' && obj.meshId)
      .filter(([objectId]) => objectId !== excludeId)
      .map(([objectId, obj]) => {
        if (!obj.meshId) return null
        return (
          <SelectableMesh
            key={objectId}
            objectId={objectId}
            mesh={scene.meshes[obj.meshId]}
          />
        )
      })
      .filter(Boolean)
  }, [scene, selection.objectIds, mode])
  return <>{meshes}</>
} 