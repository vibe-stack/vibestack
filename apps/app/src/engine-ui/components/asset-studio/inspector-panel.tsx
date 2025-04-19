import { useState } from 'react'
import { useEditorStore } from '../../editor/store'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Toggle } from '@/components/ui/toggle'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { Material } from '../../model/material'

export default function InspectorPanel() {
  const scene = useEditorStore((s) => s.scene)
  const selection = useEditorStore((s) => s.selection)
  const mode = useEditorStore((s) => s.mode)

  if (!scene) return <div className="h-full p-4 text-xs text-zinc-400">No scene loaded</div>

  if (mode === 'object') {
    if (!selection.objectIds.length) return <div className="h-full p-4 text-xs text-zinc-400">No selection</div>
    const objectId = selection.objectIds[0]
    const obj = scene.objects[objectId]
    if (!obj) return <div className="h-full p-4 text-xs text-zinc-400">Selected object not found</div>
    return (
      <div className="h-full p-4 text-xs overflow-auto bg-zinc-950/80 rounded-xl border border-green-900/10 shadow-inner flex flex-col gap-2">
        <ObjectInspector objectId={objectId} />
      </div>
    )
  }

  if (selection.elementType && selection.elementIds?.length) {
    return (
      <div className="h-full p-4 text-xs text-zinc-400">
        <div className="mb-1 font-semibold">Selected {selection.elementType}s:</div>
        {selection.elementIds.map((id) => (
          <div key={id}>{id}</div>
        ))}
      </div>
    )
  }

  return <div className="h-full p-4 text-xs text-zinc-400">No selection</div>
}

function ObjectInspector({ objectId }: { objectId: string }) {
  const scene = useEditorStore((s) => s.scene)
  const setObjectTransform = useEditorStore((s) => s.setObjectTransform)
  const setObjectVisibility = useEditorStore((s) => s.setObjectVisibility)
  const setObjectWireframe = useEditorStore((s) => s.setObjectWireframe)
  const setObjectShading = useEditorStore((s) => s.setObjectShading)
  const setObjectSides = useEditorStore((s) => s.setObjectSides)
  const setObjectShadow = useEditorStore((s) => s.setObjectShadow)
  const setObjectMaterial = useEditorStore((s) => s.setObjectMaterial)
  const createMaterial = useEditorStore((s) => s.createMaterial)
  const setObjectName = useEditorStore((s) => s.setObjectName)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    transform: true,
    material: true,
    display: true,
    shadow: true
  })
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')

  if (!scene) return null
  const obj = scene.objects[objectId]
  if (!obj) return null
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }
  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return
    const newPosition = [...obj.transform.position] as [number, number, number]
    const index = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    newPosition[index] = numValue
    setObjectTransform(objectId, { ...obj.transform, position: newPosition })
  }
  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return
    const newRotation = [...obj.transform.rotation] as [number, number, number]
    const index = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    // Convert degrees to radians
    newRotation[index] = (numValue * Math.PI) / 180
    setObjectTransform(objectId, { ...obj.transform, rotation: newRotation })
  }
  const handleScaleChange = (axis: 'x' | 'y' | 'z', value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return
    const newScale = [...obj.transform.scale] as [number, number, number]
    const index = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    newScale[index] = numValue
    setObjectTransform(objectId, { ...obj.transform, scale: newScale })
  }
  const material = obj.materialId ? scene.materials?.[obj.materialId] : undefined
  const objectsWithThisMaterial = Object.values(scene.objects).filter(o => o.materialId === material?.id)
  const addNewMaterial = () => {
    const newMaterial = createMaterial('standard')
    setObjectMaterial(objectId, newMaterial.id)
  }
  // Utility to omit a key from an object
  function omit<T extends object, K extends keyof T>(obj: T, key: K): Omit<T, K> {
    const { [key]: _, ...rest } = obj
    return rest
  }
  const handleDuplicateMaterial = () => {
    if (!material) return
    const rest = omit(material, 'id')
    const newMaterial = createMaterial(material.type, { ...rest })
    setObjectMaterial(objectId, newMaterial.id)
  }

  const handleNameBlur = () => {
    setEditingName(false)
    if (nameValue.trim() && nameValue !== obj.name) {
      setObjectName(objectId, nameValue.trim())
    }
  }

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur()
    } else if (e.key === 'Escape') {
      setNameValue(obj.name)
      setEditingName(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        {editingName ? (
          <input
            className="font-semibold text-green-200 text-sm tracking-wide flex-1 truncate bg-transparent border-b border-green-400 outline-none px-1"
            value={nameValue}
            autoFocus
            onChange={e => setNameValue(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            maxLength={64}
          />
        ) : (
          <div
            className="font-semibold text-green-200 text-sm tracking-wide flex-1 truncate cursor-pointer"
            title="Click to rename"
            onClick={() => setEditingName(true)}
          >
            {obj.name}
          </div>
        )}
        <span className="text-xs text-zinc-500 font-medium">{obj.type}</span>
      </div>
      <SectionCard>
        <SectionHeader title="Transform" expanded={expandedSections.transform} onClick={() => toggleSection('transform')} />
        {expandedSections.transform && (
          <div className="flex flex-col gap-2 mt-2">
            <TransformRow label="Position" values={obj.transform.position} onChange={handlePositionChange} />
            <TransformRow label="Rotation" values={obj.transform.rotation.map(r => Math.round((r * 180) / Math.PI * 1000) / 1000) as [number, number, number]} onChange={handleRotationChange} />
            <TransformRow label="Scale" values={obj.transform.scale} onChange={handleScaleChange} />
          </div>
        )}
      </SectionCard>
      <SectionCard>
        <div className="flex items-center justify-between mb-1">
          <SectionHeader title="Material" expanded={expandedSections.material} onClick={() => toggleSection('material')} />
          <button className="w-6 h-6 flex items-center justify-center rounded-md bg-zinc-900 border border-green-900/30 text-green-300 hover:bg-green-900/20 transition" onClick={addNewMaterial} title="Add new material">
            <Plus className="size-4" />
          </button>
        </div>
        {expandedSections.material && (
          <div className="mt-2">
            {!material ? (
              <div className="text-center py-2 text-zinc-500">No material assigned</div>
            ) : (
              <>
                {objectsWithThisMaterial.length > 1 && (
                  <button
                    className="mb-2 px-2 py-1 rounded bg-green-900/30 text-green-200 text-xs border border-green-900/30 hover:bg-green-900/50 transition"
                    onClick={handleDuplicateMaterial}
                  >
                    Duplicate & Edit (make unique)
                  </button>
                )}
                <MaterialEditor materialId={material.id} />
              </>
            )}
          </div>
        )}
      </SectionCard>
      <SectionCard>
        <SectionHeader title="Display" expanded={expandedSections.display} onClick={() => toggleSection('display')} />
        {expandedSections.display && (
          <div className="flex flex-col gap-2 mt-2">
            <ToggleRow label="Visible" value={obj.visible} onChange={v => setObjectVisibility(objectId, v)} />
            <ToggleRow label="Wireframe" value={obj.wireframe} onChange={v => setObjectWireframe(objectId, v)} />
            <ToggleRow label="Shading" value={obj.shading} options={[{ label: 'Flat', value: 'flat' }, { label: 'Smooth', value: 'smooth' }]} onChange={v => setObjectShading(objectId, v)} />
            <ToggleRow label="Sides" value={obj.sides} options={[{ label: 'Front', value: 'front' }, { label: 'Back', value: 'back' }, { label: 'Double', value: 'double' }]} onChange={v => setObjectSides(objectId, v)} />
          </div>
        )}
      </SectionCard>
      <SectionCard>
        <SectionHeader title="Shadow" expanded={expandedSections.shadow} onClick={() => toggleSection('shadow')} />
        {expandedSections.shadow && (
          <div className="flex flex-col gap-2 mt-2">
            <ToggleRow label="Cast" value={obj.castShadow} onChange={v => setObjectShadow(objectId, { cast: v })} />
            <ToggleRow label="Receive" value={obj.receiveShadow} onChange={v => setObjectShadow(objectId, { receive: v })} />
          </div>
        )}
      </SectionCard>
    </div>
  )
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-zinc-900/70 border border-green-900/10 shadow-sm px-3 py-2 mb-1 flex flex-col gap-1">
      {children}
    </div>
  )
}

function SectionHeader({ title, expanded, onClick }: { title: string; expanded: boolean; onClick: () => void }) {
  return (
    <button type="button" className="flex items-center gap-1 text-green-300 font-medium text-xs tracking-wide uppercase select-none focus:outline-none" onClick={onClick}>
      {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
      <span>{title}</span>
    </button>
  )
}

function TransformRow({ label, values, onChange }: { label: string; values: [number, number, number]; onChange: (axis: 'x' | 'y' | 'z', value: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 min-w-16 max-w-16 text-zinc-400 text-xs font-medium text-right">{label}</span>
      <div className="flex gap-2 flex-1">
        {(['x', 'y', 'z'] as const).map((axis, i) => (
          <Input
            key={axis}
            type="number"
            value={values[i]}
            step={0.1}
            onChange={e => onChange(axis, e.target.value)}
            className="h-6 w-14 px-1 text-xs bg-zinc-950 border-zinc-800 focus:border-green-400 text-center"
          />
        ))}
      </div>
    </div>
  )
}

function ToggleRow({ label, value, onChange, options }: { label: string; value: any; onChange: (v: any) => void; options?: { label: string; value: any }[] }) {
  if (options) {
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="w-16 min-w-16 max-w-16 text-zinc-400 text-xs font-medium text-right">{label}</span>
        <div className="flex gap-1">
          {options.map(opt => (
            <Toggle
              key={opt.value}
              pressed={value === opt.value}
              onPressedChange={() => onChange(opt.value)}
              size="sm"
              variant="outline"
              className={`rounded-md px-2 h-6 min-w-12 text-xs font-medium ${value === opt.value ? 'bg-green-800/40 text-green-200' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-green-900/10'}`}
            >
              {opt.label}
            </Toggle>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="w-16 min-w-16 max-w-16 text-zinc-400 text-xs font-medium text-right">{label}</span>
      <div className="flex gap-1">
        <Toggle
          pressed={!!value}
          onPressedChange={() => onChange(true)}
          size="sm"
          variant="outline"
          className={`rounded-l-md px-2 h-6 min-w-10 text-xs font-medium ${value ? 'bg-green-800/40 text-green-200' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-green-900/10'}`}
        >
          Yes
        </Toggle>
        <Toggle
          pressed={!value}
          onPressedChange={() => onChange(false)}
          size="sm"
          variant="outline"
          className={`rounded-r-md px-2 h-6 min-w-10 text-xs font-medium ${!value ? 'bg-green-800/40 text-green-200' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-green-900/10'}`}
        >
          No
        </Toggle>
      </div>
    </div>
  )
}

function MaterialEditor({ materialId }: { materialId: string }) {
  const scene = useEditorStore((s) => s.scene)
  const updateMaterial = useEditorStore((s) => s.updateMaterial)
  const [isOpen, setIsOpen] = useState(false)
  if (!scene || !scene.materials) return null
  const material = scene.materials[materialId]
  if (!material) return null
  const handleColorChange = (color: string) => {
    updateMaterial(materialId, { color })
  }
  const handlePropertyChange = (key: keyof Material, value: any) => {
    updateMaterial(materialId, { [key]: value })
  }
  const handleWireframeToggle = (enabled: boolean) => {
    updateMaterial(materialId, { wireframe: enabled })
  }
  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 px-2 py-1 rounded-lg bg-zinc-950 border border-green-900/20 text-green-200 hover:bg-green-900/10 shadow-sm transition focus:outline-none">
            <div className="size-4 rounded-full border border-white/20" style={{ backgroundColor: material.color }} />
            <span className="font-medium text-xs">{material.name}</span>
            <ChevronDown className="size-3 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-3 w-64 bg-zinc-950 border-green-900/30 rounded-xl shadow-xl" align="start">
          <div className="space-y-3">
            <div className="text-center border-b border-green-900/20 pb-2 mb-2">
              <span className="font-semibold text-green-200 text-xs tracking-wide">{material.type.toUpperCase()} Material</span>
            </div>
            <div className="space-y-2">
              <div className="space-y-1">
                <span className="text-zinc-400 text-xs font-medium">Color</span>
                <div className="grid grid-cols-8 gap-1 mb-1">
                  {["#22c55e", "#f97316", "#3b82f6", "#eab308", "#ec4899", "#f43f5e", "#a855f7", "#ffffff", "#18181b", "#a3e635", "#facc15", "#38bdf8", "#f472b6", "#f87171", "#c084fc", "#d4d4d8"].map((color) => (
                    <button
                      key={color}
                      className={`size-5 rounded-md border-2 transition-all duration-100 ${material.color === color ? 'border-green-400 ring-2 ring-green-300' : 'border-zinc-800 hover:border-green-400'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorChange(color)}
                      tabIndex={-1}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="size-4 rounded-full border border-white/20" style={{ backgroundColor: material.color }} />
                  <Input type="text" value={material.color} onChange={e => handleColorChange(e.target.value)} className="h-6 w-full px-1 text-xs bg-zinc-950 border-zinc-800 focus:border-green-400" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-zinc-400 font-medium">Wireframe</span>
                <div className="flex gap-1">
                  <Toggle
                    pressed={material.wireframe}
                    onPressedChange={() => handleWireframeToggle(true)}
                    size="sm"
                    variant="outline"
                    className={`rounded-l-md px-2 h-6 min-w-9 text-xs font-medium ${material.wireframe ? 'bg-green-800/40 text-green-200' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-green-900/10'}`}
                  >
                    On
                  </Toggle>
                  <Toggle
                    pressed={!material.wireframe}
                    onPressedChange={() => handleWireframeToggle(false)}
                    size="sm"
                    variant="outline"
                    className={`rounded-r-md px-2 h-6 min-w-9 text-xs font-medium ${!material.wireframe ? 'bg-green-800/40 text-green-200' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-green-900/10'}`}
                  >
                    Off
                  </Toggle>
                </div>
              </div>
              {material.type === 'standard' && (
                <>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-zinc-400 font-medium">Roughness</span>
                    <Input type="number" value={material.roughness ?? 0.5} min={0} max={1} step={0.1} onChange={e => handlePropertyChange('roughness', parseFloat(e.target.value))} className="h-6 w-16 px-1 text-xs bg-zinc-950 border-zinc-800 focus:border-green-400" />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-zinc-400 font-medium">Metalness</span>
                    <Input type="number" value={material.metalness ?? 0} min={0} max={1} step={0.1} onChange={e => handlePropertyChange('metalness', parseFloat(e.target.value))} className="h-6 w-16 px-1 text-xs bg-zinc-950 border-zinc-800 focus:border-green-400" />
                  </div>
                </>
              )}
              {material.type === 'phong' && (
                <>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-zinc-400 font-medium">Shininess</span>
                    <Input type="number" value={material.shininess ?? 30} min={0} max={100} step={1} onChange={e => handlePropertyChange('shininess', parseFloat(e.target.value))} className="h-6 w-16 px-1 text-xs bg-zinc-950 border-zinc-800 focus:border-green-400" />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-zinc-400 font-medium">Specular</span>
                    <Input type="text" value={material.specular ?? '#111111'} onChange={e => handlePropertyChange('specular', e.target.value)} className="h-6 w-16 px-1 text-xs bg-zinc-950 border-zinc-800 focus:border-green-400" />
                  </div>
                </>
              )}
              {material.type === 'physical' && (
                <>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-zinc-400 font-medium">Clearcoat</span>
                    <Input type="number" value={material.clearcoat ?? 0} min={0} max={1} step={0.1} onChange={e => handlePropertyChange('clearcoat', parseFloat(e.target.value))} className="h-6 w-16 px-1 text-xs bg-zinc-950 border-zinc-800 focus:border-green-400" />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-zinc-400 font-medium">Rough.</span>
                    <Input type="number" value={material.clearcoatRoughness ?? 0} min={0} max={1} step={0.1} onChange={e => handlePropertyChange('clearcoatRoughness', parseFloat(e.target.value))} className="h-6 w-16 px-1 text-xs bg-zinc-950 border-zinc-800 focus:border-green-400" />
                  </div>
                </>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
} 