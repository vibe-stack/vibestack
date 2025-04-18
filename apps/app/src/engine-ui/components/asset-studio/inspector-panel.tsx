import { useEditorStore } from '../../editor/store'

export default function InspectorPanel() {
  const scene = useEditorStore((s) => s.scene)
  const selection = useEditorStore((s) => s.selection)
  const mode = useEditorStore((s) => s.mode)

  if (!scene) return <div className="h-full p-2 text-xs">No selection</div>

  if (mode === 'object') {
    if (!selection.objectIds.length) return <div className="h-full p-2 text-xs">No selection</div>
    return (
      <div className="h-full p-2 text-xs">
        <div className="mb-1 font-semibold">Selected Objects:</div>
        {selection.objectIds.map((id) => {
          const obj = scene.objects[id]
          if (!obj) return null
          return (
            <div key={id} className="mb-1">
              <div>Name: {obj.name}</div>
              <div>Type: {obj.type}</div>
            </div>
          )
        })}
      </div>
    )
  }

  if (selection.elementType && selection.elementIds?.length) {
    return (
      <div className="h-full p-2 text-xs">
        <div className="mb-1 font-semibold">Selected {selection.elementType}s:</div>
        {selection.elementIds.map((id) => (
          <div key={id}>{id}</div>
        ))}
      </div>
    )
  }

  return <div className="h-full p-2 text-xs">No selection</div>
} 