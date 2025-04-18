import { useEditorStore } from '../../editor/store'

export default function CameraBar() {
  const cameraType = useEditorStore((s) => s.cameraType)
  const setCameraType = useEditorStore((s) => s.setCameraType)

  return (
    <div className="w-full flex justify-center items-center gap-2 p-1 bg-neutral-900 border-t border-neutral-800 text-xs">
      <span className="text-neutral-300">Camera:</span>
      <button
        className={
          'px-2 py-1 rounded ' +
          (cameraType === 'perspective' ? 'bg-cyan-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700')
        }
        style={{ fontSize: '0.85em' }}
        onClick={() => setCameraType('perspective')}
      >
        Perspective
      </button>
      <button
        className={
          'px-2 py-1 rounded ' +
          (cameraType === 'orthographic' ? 'bg-cyan-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700')
        }
        style={{ fontSize: '0.85em' }}
        onClick={() => setCameraType('orthographic')}
      >
        Orthographic
      </button>
    </div>
  )
} 