import { useEditorStore } from '../../editor/store'
import { MousePointer2, Move3D, Square, Circle, Triangle } from 'lucide-react'

const editModes = [
  { key: 'edit-vertex', label: 'Vertex', icon: <Circle size={16} /> },
  { key: 'edit-edge', label: 'Edge', icon: <Triangle size={16} /> },
  { key: 'edit-face', label: 'Face', icon: <Square size={16} /> },
] as const

export default function ModeToolbar() {
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)
  const isEdit = mode !== 'object'

  return (
    <div className="flex gap-2 p-1 bg-neutral-900 border-b border-neutral-800 rounded-md shadow-sm text-xs">
      <button
        className={
          'flex items-center gap-1 px-2 py-1 rounded ' +
          (!isEdit ? 'bg-cyan-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700')
        }
        style={{ fontSize: '0.85em' }}
        onClick={() => setMode('object')}
      >
        <MousePointer2 size={16} /> Object
      </button>
      <button
        className={
          'flex items-center gap-1 px-2 py-1 rounded ' +
          (isEdit ? 'bg-cyan-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700')
        }
        style={{ fontSize: '0.85em' }}
        onClick={() => setMode('edit-vertex')}
      >
        <Move3D size={16} /> Edit
      </button>
      {isEdit && (
        <div className="flex gap-1 ml-2">
          {editModes.map((m) => (
            <button
              key={m.key}
              className={
                'flex items-center gap-1 px-2 py-1 rounded ' +
                (mode === m.key ? 'bg-cyan-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700')
              }
              style={{ fontSize: '0.85em' }}
              onClick={() => setMode(m.key)}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 