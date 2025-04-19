import { useEditorStore } from '@/engine-ui/editor/store'
import { FaceMeshes, VertexSpheres } from './edit-mode/outlines'
import { EdgeLines, LoopCutOverlay } from './edit-mode/outlines'

export default function EditModeOverlays() {
  const scene = useEditorStore((s) => s.scene)
  const selection = useEditorStore((s) => s.selection)
  const setSelection = useEditorStore((s) => s.setSelection)
  const mode = useEditorStore((s) => s.mode)
  const currentTool = useEditorStore((s) => s.currentTool)

  if (!scene || selection.objectIds.length !== 1) return null
  const obj = scene.objects[selection.objectIds[0]]
  if (!obj || !obj.meshId) return null
  const mesh = scene.meshes[obj.meshId]

  return (
    <>
      { mode === "edit-vertex" && <VertexSpheres
        meshId={obj.meshId}
        selectedIds={selection.elementType === 'vertex' && selection.elementIds ? selection.elementIds : []}
        onSelect={(vertexId, e) => {
          if (e.shiftKey) {
            if (selection.elementType === 'vertex' && selection.elementIds?.includes(vertexId)) {
              setSelection({ ...selection, elementType: 'vertex', elementIds: selection.elementIds!.filter(id => id !== vertexId) })
            } else {
              setSelection({ ...selection, elementType: 'vertex', elementIds: [...(selection.elementIds || []), vertexId] })
            }
          } else {
            setSelection({ ...selection, elementType: 'vertex', elementIds: [vertexId] })
          }
        }}
        position={obj.transform.position}
        rotation={obj.transform.rotation}
        scale={obj.transform.scale}
      /> }
      {mode === 'edit-edge' && currentTool === 'loop-cut' ? (
        <LoopCutOverlay
          mesh={mesh}
          position={obj.transform.position}
          rotation={obj.transform.rotation}
          scale={obj.transform.scale}
        />
      ) : (
        <EdgeLines
          mesh={mesh}
          selectedIds={selection.elementType === 'edge' && selection.elementIds ? selection.elementIds : []}
          onSelect={mode === 'edit-edge' ? ((edgeId, e) => {
            if (e.shiftKey) {
              if (selection.elementType === 'edge' && selection.elementIds?.includes(edgeId)) {
                setSelection({ ...selection, elementType: 'edge', elementIds: selection.elementIds!.filter(id => id !== edgeId) })
              } else {
                setSelection({ ...selection, elementType: 'edge', elementIds: [...(selection.elementIds || []), edgeId] })
              }
            } else {
              setSelection({ ...selection, elementType: 'edge', elementIds: [edgeId] })
            }
          }) : (() => {})}
          position={obj.transform.position}
          rotation={obj.transform.rotation}
          scale={obj.transform.scale}
        />
      )}
      {mode === 'edit-face' && (
        <FaceMeshes
          mesh={mesh}
          selectedIds={selection.elementType === 'face' && selection.elementIds ? selection.elementIds : []}
          onSelect={(faceId, e) => {
            if (e.shiftKey) {
              if (selection.elementType === 'face' && selection.elementIds?.includes(faceId)) {
                setSelection({ ...selection, elementType: 'face', elementIds: selection.elementIds!.filter(id => id !== faceId) })
              } else {
                setSelection({ ...selection, elementType: 'face', elementIds: [...(selection.elementIds || []), faceId] })
              }
            } else {
              setSelection({ ...selection, elementType: 'face', elementIds: [faceId] })
            }
          }}
          position={obj.transform.position}
          rotation={obj.transform.rotation}
          scale={obj.transform.scale}
        />
      )}
    </>
  )
} 