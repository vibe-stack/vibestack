import { Plus, Square, Circle, Box, RectangleHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useEditorStore } from '../../editor/store'
import { v4 as uuidv4 } from 'uuid'
import type { Object3D } from '../../model/object3d'
import { createMesh, MeshType } from '../../model/mesh-factory'

const shapes = [
  { key: 'cube', label: 'Cube', icon: <Box size={16} /> },
  { key: 'cylinder', label: 'Cylinder', icon: <RectangleHorizontal size={16} /> },
  { key: 'sphere', label: 'Sphere', icon: <Circle size={16} /> },
  { key: 'plane', label: 'Plane', icon: <Square size={16} /> },
]

// const shapeToMesh = {
//   cube: createCubeMesh,
//   cylinder: createCylinderMesh,
//   sphere: createSphereMesh,
//   plane: createPlaneMesh,
// } as const

// type ShapeKey = keyof typeof shapeToMesh

export default function AddObjectBar() {
  const [open, setOpen] = useState(false)
  const scene = useEditorStore(s => s.scene)
  const setScene = useEditorStore(s => s.setScene)
  const setSelection = useEditorStore(s => s.setSelection)
  const [lastAdded, setLastAdded] = useState<string | null>(null)

  function handleAdd(shapeKey: string) {
    if (!scene) return
    const mesh = createMesh(shapeKey as MeshType)
    const meshId = mesh.id
    const objectId = uuidv4()
    const rootObjectId = scene.rootObjectId
    
    // Create default material if needed or reuse existing one
    let defaultMaterialId: string
    
    // Find the first green standard material or create one
    const existingMaterial = Object.values(scene.materials || {}).find(
      m => m.type === 'standard' && m.color === '#22c55e'
    )
    
    if (existingMaterial) {
      defaultMaterialId = existingMaterial.id
    } else {
      defaultMaterialId = uuidv4()
      const defaultMaterial = {
        id: defaultMaterialId,
        name: 'Default Green',
        type: 'standard' as const,
        color: '#22c55e',
        wireframe: false,
        roughness: 0.5,
        metalness: 0.0
      }
      scene.materials = scene.materials || {}
      scene.materials[defaultMaterialId] = defaultMaterial
    }
    
    const object: Object3D = {
      id: objectId,
      name: shapeKey.charAt(0).toUpperCase() + shapeKey.slice(1),
      type: 'mesh',
      transform: {
        position: [0, 0, 0] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        scale: [1, 1, 1] as [number, number, number],
      },
      parent: rootObjectId,
      children: [],
      meshId,
      materialId: defaultMaterialId,
      visible: true,
      wireframe: false,
      shading: 'smooth' as const,
      sides: 'front' as const,
      castShadow: true,
      receiveShadow: true
    }
    const rootObject = scene.objects[rootObjectId]
    setScene({
      ...scene,
      objects: {
        ...scene.objects,
        [objectId]: object,
        [rootObjectId]: {
          ...rootObject,
          children: [...rootObject.children, objectId],
        },
      },
      meshes: { ...scene.meshes, [meshId]: mesh },
      materials: { ...scene.materials },
    })
    setSelection({ objectIds: [objectId] })
    setLastAdded(shapeKey)
    setOpen(false)
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-zinc-950/80 border border-green-900/10 shadow-inner text-xs">
      <button
        className="flex items-center justify-center w-6 h-6 rounded border border-green-400 text-green-400 bg-transparent hover:bg-green-900/10 transition-all duration-150"
        onClick={() => setOpen((v) => !v)}
        title="Add object"
      >
        <Plus size={16} />
      </button>
      {shapes.map((shape) => (
        <button
          key={shape.key}
          className={
            'flex items-center gap-1 px-2 py-1 rounded transition-all duration-150 border-b-2 ' +
            (lastAdded === shape.key
              ? 'border-green-400 text-green-200 bg-transparent'
              : 'border-transparent text-zinc-400 bg-transparent hover:bg-zinc-800/30')
          }
          style={{ fontSize: '0.95em' }}
          title={`Add ${shape.label}`}
          onClick={() => handleAdd(shape.key)}
        >
          {shape.icon} {shape.label}
        </button>
      ))}
      {open && (
        <div className="absolute mt-2 left-0 z-10 bg-neutral-900 border border-neutral-800 rounded shadow p-2 flex flex-col gap-1">
          {shapes.map((shape) => (
            <button
              key={shape.key}
              className={
                'flex items-center gap-2 px-2 py-1 rounded transition-all duration-150 border-b-2 ' +
                (lastAdded === shape.key
                  ? 'border-green-400 text-green-200 bg-transparent'
                  : 'border-transparent text-zinc-400 bg-transparent hover:bg-zinc-800/30')
              }
              onClick={() => handleAdd(shape.key)}
            >
              {shape.icon} {shape.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 