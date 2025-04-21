import { useEffect, useRef } from 'react'
import SceneTreePanel from '../components/asset-studio/scene-tree-panel'
import InspectorPanel from '../components/asset-studio/inspector-panel'
import ViewportCanvas from '../components/asset-studio/viewport-canvas'
import { useEditorStore } from '../editor/store'
import { createDefaultScene } from '../model/scene-default'
import ModeToolbar from '../components/asset-studio/mode-toolbar'
import AddObjectBar from '../components/asset-studio/add-object-bar'
import { v4 as uuidv4 } from 'uuid'
import type { Object3D } from '../model/object3d'
import { z } from 'zod'
import { experimental_useObject as useObject } from '@ai-sdk/react'
import AssetStudioPromptBar from '../components/asset-studio/asset-studio-prompt-bar'

const meshSchema = z.object({
  id: z.string(),
  vertices: z.record(z.object({
    id: z.string(),
    position: z.tuple([z.number(), z.number(), z.number()]),
    halfEdge: z.string().nullable()
  })),
  halfEdges: z.record(z.object({
    id: z.string(),
    vertex: z.string(),
    pair: z.string().nullable(),
    face: z.string(),
    next: z.string(),
    prev: z.string()
  })),
  faces: z.record(z.object({
    id: z.string(),
    halfEdge: z.string()
  })),
  modifiers: z.array(z.string())
})

export default function AssetStudioView() {
  const scene = useEditorStore((s) => s.scene)
  const setScene = useEditorStore((s) => s.setScene)
  const setSelection = useEditorStore((s) => s.setSelection)
  const mode = useEditorStore((s) => s.mode)
  const selection = useEditorStore((s) => s.selection)
  const lastPromptRef = useRef<string | null>(null)

  console.log('scene', scene)

  useEffect(() => {
    if (!scene) setScene(createDefaultScene())
  }, [scene, setScene])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Prevent delete if an input, textarea, or contenteditable is focused
      const active = document.activeElement
      if (
        active &&
        ((active.tagName === 'INPUT' && (active as HTMLInputElement).type !== 'checkbox' && (active as HTMLInputElement).type !== 'radio') ||
         active.tagName === 'TEXTAREA' ||
         (active as HTMLElement).isContentEditable)
      ) {
        return
      }
      if (mode === 'object' && selection.objectIds.length > 0 && e.key === 'Backspace') {
        if (!scene) return
        // Prevent deleting the root object
        const rootObjectId = scene.rootObjectId
        const deletableIds = selection.objectIds.filter(id => id !== rootObjectId)
        if (deletableIds.length === 0) return
        const newObjects = { ...scene.objects }
        const newMeshes = { ...scene.meshes }
        for (const id of deletableIds) {
          const obj = scene.objects[id]
          if (obj) {
            if (obj.meshId) delete newMeshes[obj.meshId]
            delete newObjects[id]
          }
        }
        // Remove deleted objects from their parent's children
        for (const id in newObjects) {
          // clone the object before mutating
          const obj = { ...newObjects[id] }
          obj.children = obj.children.filter((cid: string) => !deletableIds.includes(cid))
          newObjects[id] = obj
        }
        setScene({ ...scene, objects: newObjects, meshes: newMeshes })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, selection, scene, setScene])

  const { object: mesh, submit, isLoading } = useObject({
    api: '/api/3d-modeler',
    schema: meshSchema
  })

  useEffect(() => {
    if (!scene || !mesh) return
    try {
      // Type guards for mesh arrays
      const isArray = Array.isArray
      const verticesArr = isArray(mesh.vertices) ? mesh.vertices as any[] : []
      const halfEdgesArr = isArray(mesh.halfEdges) ? mesh.halfEdges as any[] : []
      const facesArr = isArray(mesh.faces) ? mesh.faces as any[] : []
      const meshId = typeof mesh.id === 'string' ? mesh.id : uuidv4()
      const meshWithRecords = {
        id: meshId,
        vertices: Object.fromEntries(verticesArr.map((v: any) => [v.id, v])),
        halfEdges: Object.fromEntries(halfEdgesArr.map((e: any) => [e.id, e])),
        faces: Object.fromEntries(facesArr.map((f: any) => [f.id, f])),
        modifiers: Array.isArray(mesh.modifiers) ? mesh.modifiers : []
      } as import('../model/mesh').HEMesh
      const objectId = uuidv4()
      const rootObjectId = scene.rootObjectId
      let defaultMaterialId: string
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
        name: 'Generated',
        type: 'mesh',
        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        },
        parent: rootObjectId,
        children: [],
        meshId,
        materialId: defaultMaterialId,
        visible: true,
        wireframe: false,
        shading: 'smooth',
        sides: 'front',
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
            children: [...rootObject.children, objectId]
          }
        },
        meshes: { ...scene.meshes, [meshId]: meshWithRecords },
        materials: { ...scene.materials }
      })
      setSelection({ objectIds: [objectId], elementType: null, elementIds: [] })
    } catch (error: any) {
      setSelection({
        objectIds: [],
        elementType: null,
        elementIds: []
      })
      submit({ prompt: `regenerate your model, it gave me the following error: ${error?.message || error}` })
    }
  }, [mesh])

  function handlePromptSubmit(prompt: string) {
    lastPromptRef.current = prompt
    submit({ prompt })
  }

  return (
    <div className="h-full w-full flex flex-col relative">
      <div className="flex flex-1 w-full">
        <div className="w-64 h-full border-r border-neutral-800 bg-neutral-950">
          <SceneTreePanel />
        </div>
        <div className="flex-1 h-full flex flex-col">
          <div className="flex flex-col items-center" style={{ minHeight: 0 }}>
            <ModeToolbar />
            {mode === 'object' && (
              <div className="mt-2 mb-2 flex justify-center w-full absolute top-10 z-10">
                <AddObjectBar />
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <ViewportCanvas />
          </div>
        </div>
        <div className="w-80 h-full border-l border-neutral-800 bg-neutral-950">
          <InspectorPanel />
        </div>
      </div>
      <AssetStudioPromptBar onSubmit={handlePromptSubmit} isLoading={isLoading} />
    </div>
  );
} 