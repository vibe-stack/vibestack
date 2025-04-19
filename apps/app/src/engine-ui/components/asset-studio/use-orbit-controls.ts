import { useEditorStore } from '../../editor/store'

export function useOrbitControls() {
  const enabled = useEditorStore((s) => s.orbitControlsEnabled)
  const setEnabled = useEditorStore((s) => s.setOrbitControlsEnabled)
  return [enabled, setEnabled] as const
} 