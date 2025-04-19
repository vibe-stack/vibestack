import { useEditorStore } from '../../editor/store'
import { MousePointer2, Move3D, Square, Circle, Triangle, RotateCw, Scale3D, ArrowUpRight, CornerDownRight, Divide, Layers3 } from 'lucide-react'

const editModes = [
  { key: 'edit-vertex', label: 'Vertex', icon: <Circle size={16} /> },
  { key: 'edit-edge', label: 'Edge', icon: <Triangle size={16} /> },
  { key: 'edit-face', label: 'Face', icon: <Square size={16} /> },
] as const

const toolOptions = {
  'edit-vertex': [
    { key: 'select', label: 'Select', icon: <MousePointer2 size={15} /> },
  ],
  'edit-edge': [
    { key: 'select', label: 'Select', icon: <MousePointer2 size={15} /> },
    { key: 'loop-cut', label: 'Loop Cut', icon: <Divide size={15} /> },
  ],
  'edit-face': [
    { key: 'select', label: 'Select', icon: <MousePointer2 size={15} /> },
    { key: 'extrude', label: 'Extrude', icon: <CornerDownRight size={15} /> },
    { key: 'inset', label: 'Inset', icon: <Layers3 size={15} /> },
  ],
}

export default function ModeToolbar() {
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)
  const gizmoMode = useEditorStore((s) => s.gizmoMode)
  const setGizmoMode = useEditorStore((s) => s.setGizmoMode)
  const isEdit = mode !== 'object'
  const currentTool = useEditorStore((s) => s.currentTool)
  const setCurrentTool = useEditorStore((s) => s.setCurrentTool)

  return (
    <div className="flex gap-2 p-2 bg-zinc-950/80 border border-green-900/10 rounded-xl shadow-inner text-xs items-center">
      <button
        className={
          'flex items-center gap-1 px-3 py-1.5 rounded transition-all duration-150 border-b-2 ' +
          (!isEdit
            ? 'border-green-400 text-green-200 bg-transparent'
            : 'border-transparent text-zinc-400 bg-transparent hover:bg-zinc-800/30')
        }
        style={{ fontSize: '0.95em' }}
        onClick={() => setMode('object')}
      >
        <MousePointer2 size={16} /> Object
      </button>
      <button
        className={
          'flex items-center gap-1 px-3 py-1.5 rounded transition-all duration-150 border-b-2 ' +
          (isEdit
            ? 'border-green-400 text-green-200 bg-transparent'
            : 'border-transparent text-zinc-400 bg-transparent hover:bg-zinc-800/30')
        }
        style={{ fontSize: '0.95em' }}
        onClick={() => setMode('edit-vertex')}
      >
        <Move3D size={16} /> Edit
      </button>
      {!isEdit && (
        <div className="flex gap-1 ml-2">
          <button
            className={
              'flex items-center gap-1 px-2 py-1 rounded transition-all duration-150 border-b-2 ' +
              (gizmoMode === 'translate'
                ? 'border-green-400 text-green-200 bg-transparent'
                : 'border-transparent text-zinc-400 bg-transparent hover:bg-zinc-800/30')
            }
            style={{ fontSize: '0.95em' }}
            onClick={() => setGizmoMode('translate')}
            title="Move"
          >
            <ArrowUpRight size={16} /> Move
          </button>
          <button
            className={
              'flex items-center gap-1 px-2 py-1 rounded transition-all duration-150 border-b-2 ' +
              (gizmoMode === 'rotate'
                ? 'border-green-400 text-green-200 bg-transparent'
                : 'border-transparent text-zinc-400 bg-transparent hover:bg-zinc-800/30')
            }
            style={{ fontSize: '0.95em' }}
            onClick={() => setGizmoMode('rotate')}
            title="Rotate"
          >
            <RotateCw size={16} /> Rotate
          </button>
          <button
            className={
              'flex items-center gap-1 px-2 py-1 rounded transition-all duration-150 border-b-2 ' +
              (gizmoMode === 'scale'
                ? 'border-green-400 text-green-200 bg-transparent'
                : 'border-transparent text-zinc-400 bg-transparent hover:bg-zinc-800/30')
            }
            style={{ fontSize: '0.95em' }}
            onClick={() => setGizmoMode('scale')}
            title="Scale"
          >
            <Scale3D size={16} /> Scale
          </button>
        </div>
      )}
      {isEdit && (
        <div className="flex gap-1 ml-2">
          {editModes.map((m) => (
            <button
              key={m.key}
              className={
                'flex items-center gap-1 px-2 py-1 rounded transition-all duration-150 border-b-2 ' +
                (mode === m.key
                  ? 'border-green-400 text-green-200 bg-transparent'
                  : 'border-transparent text-zinc-400 bg-transparent hover:bg-zinc-800/30')
              }
              style={{ fontSize: '0.95em' }}
              onClick={() => setMode(m.key)}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      )}
      {isEdit && (
        <div className="flex gap-1 ml-4 border-l border-green-900/20 pl-3">
          {toolOptions[mode]?.map((tool) => (
            <button
              key={tool.key}
              className={
                'flex items-center gap-1 px-2 py-1 rounded transition-all duration-150 border-b-2 ' +
                (currentTool === tool.key
                  ? 'border-green-400 text-green-200 bg-green-900/20'
                  : 'border-transparent text-zinc-400 bg-transparent hover:bg-zinc-800/30')
              }
              style={{ fontSize: '0.95em' }}
              onClick={() => setCurrentTool(tool.key as any)}
            >
              {tool.icon} {tool.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 