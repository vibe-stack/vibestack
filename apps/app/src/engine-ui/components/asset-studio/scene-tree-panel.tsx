import React from 'react'
import { useEditorStore } from '../../editor/store'

export default function SceneTreePanel() {
  const scene = useEditorStore((s) => s.scene)
  const selection = useEditorStore((s) => s.selection)
  const setSelection = useEditorStore((s) => s.setSelection)

  if (!scene) return null

  function handleSelect(objectId: string, e: React.MouseEvent) {
    if (e.shiftKey) {
      if (selection.objectIds.includes(objectId)) {
        setSelection({ ...selection, objectIds: selection.objectIds.filter(id => id !== objectId) })
      } else {
        setSelection({ ...selection, objectIds: [...selection.objectIds, objectId] })
      }
    } else {
      setSelection({ ...selection, objectIds: [objectId] })
    }
  }

  function renderNode(objectId: string, depth = 0): React.ReactNode {
    if (!scene) return null
    const obj = scene.objects[objectId]
    if (!obj) return null
    const isSelected = selection.objectIds.includes(objectId)
    return (
      <div key={objectId} style={{ paddingLeft: depth * 8, fontSize: '0.85em' }} className="leading-tight">
        <div
          className={isSelected ? 'font-bold text-cyan-400' : 'text-neutral-300'}
          style={{ cursor: 'pointer', padding: '2px 0' }}
          onClick={e => handleSelect(objectId, e)}
        >
          {obj.name}
        </div>
        {obj.children.map((childId) => renderNode(childId, depth + 1))}
      </div>
    )
  }

  return <div className="h-full overflow-auto p-2">{renderNode(scene.rootObjectId)}</div>
} 