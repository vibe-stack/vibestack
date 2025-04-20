import { useEditorStore } from '@/engine-ui/editor/store'
import { editModeOverlayRegistry } from './overlays-registry'
import type { EditorMode, EditorState } from '@/engine-ui/editor/store'
import type { Scene } from '@/engine-ui/model/scene'
import { EdgeLines } from './edit-mode/outlines'

function getOverlayProps({ mode, selection, setSelection, obj, mesh }: {
  mode: EditorMode
  selection: EditorState['selection']
  setSelection: (selection: EditorState['selection']) => void
  obj: Scene['objects'][string]
  mesh: Scene['meshes'][string]
}) {
  const elementType = mode.replace('edit-', '') as 'vertex' | 'edge' | 'face'
  return {
    mesh,
    meshId: obj.meshId as string,
    selectedIds: selection.elementType === elementType && selection.elementIds ? selection.elementIds : [],
    onSelect: (id: string, e: { shiftKey: boolean }) => {
      if (e.shiftKey) {
        if (selection.elementType === elementType && selection.elementIds?.includes(id)) {
          setSelection({ ...selection, elementType, elementIds: selection.elementIds.filter(x => x !== id) })
        } else {
          setSelection({ ...selection, elementType, elementIds: [...(selection.elementIds || []), id] })
        }
      } else {
        setSelection({ ...selection, elementType, elementIds: [id] })
      }
    },
    position: obj.transform.position,
    rotation: obj.transform.rotation,
    scale: obj.transform.scale,
  }
}

export default function EditModeOverlays() {
  const scene = useEditorStore((s) => s.scene)
  const selection = useEditorStore((s) => s.selection)
  const setSelection = useEditorStore((s) => s.setSelection)
  const mode = useEditorStore((s) => s.mode)

  if (!scene || selection.objectIds.length !== 1) return null
  const obj = scene.objects[selection.objectIds[0]]
  if (!obj || !obj.meshId) return null
  const mesh = scene.meshes[obj.meshId]

  const OverlayComponent = editModeOverlayRegistry[mode as keyof typeof editModeOverlayRegistry]
  if (!OverlayComponent) return null

  const overlayProps = getOverlayProps({ mode, selection, setSelection, obj, mesh })

  return (
    <>
      <OverlayComponent {...overlayProps} />
      <EdgeLines
        mesh={mesh}
        selectedIds={selection.elementType === 'edge' ? selection.elementIds : []}
        onSelect={(id, e) => {
          if (e.shiftKey) {
            if (selection.elementType === 'edge' && selection.elementIds?.includes(id)) {
              setSelection({ ...selection, elementType: 'edge', elementIds: selection.elementIds.filter(x => x !== id) })
            } else {
              setSelection({ ...selection, elementType: 'edge', elementIds: [...(selection.elementIds || []), id] })
            }
          } else {
            setSelection({ ...selection, elementType: 'edge', elementIds: [id] })
          }
        }}
        position={obj.transform.position}
        rotation={obj.transform.rotation}
        scale={obj.transform.scale}
        mode={mode === 'edit-vertex' || mode === 'edit-edge' || mode === 'edit-face' ? mode : undefined}
      />
    </>
  )
} 