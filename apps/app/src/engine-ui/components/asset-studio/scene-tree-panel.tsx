import React from 'react'
import { useEditorStore } from '../../editor/store'
import { FolderTree, Box } from 'lucide-react'

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
    const isGroup = obj.type === 'group'
    return (
      <div key={objectId} className="">
        <div
          className={
            'flex items-center gap-2 px-2 py-1 my-0.5 rounded-lg transition-all duration-150 cursor-pointer select-none ' +
            (isSelected
              ? 'bg-green-900/20 border border-green-400/20 shadow-[0_2px_8px_0_rgba(16,255,120,0.04)] text-green-100'
              : 'hover:bg-zinc-800/30 text-zinc-200')
          }
          style={{ paddingLeft: `${depth * 16 + 6}px` }}
          onClick={e => handleSelect(objectId, e)}
        >
          {isGroup ? (
            <FolderTree className="w-4 h-4 text-green-400/80" />
          ) : (
            <Box className="w-4 h-4 text-green-400/80" />
          )}
          <span className="truncate font-medium text-sm">{obj.name}</span>
          <span className="ml-1 text-xs text-zinc-400 opacity-70">({obj.type})</span>
        </div>
        {obj.children.map((childId) => renderNode(childId, depth + 1))}
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-3 bg-zinc-950/80 rounded-xl border border-green-900/10 shadow-inner">
      <div className="font-semibold text-green-300 text-xs mb-2 px-1 tracking-wide uppercase">Scene Hierarchy</div>
      {renderNode(scene.rootObjectId)}
    </div>
  )
} 