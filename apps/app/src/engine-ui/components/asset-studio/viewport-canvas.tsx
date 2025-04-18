import { Canvas, useFrame } from '@react-three/fiber'
import { useEditorStore } from '../../editor/store'
import { meshToBufferGeometry } from '../../utils/mesh-to-geometry'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls, PerspectiveCamera, OrthographicCamera } from '@react-three/drei'
import CameraBar from './camera-bar'

function SelectableMesh({ objectId, mesh, selected }: { objectId: string, mesh: any, selected: boolean }) {
  const setSelection = useEditorStore((s) => s.setSelection)
  const selection = useEditorStore((s) => s.selection)
  const meshRef = useRef<THREE.Mesh>(null)
  const geometry = useMemo(() => meshToBufferGeometry(mesh), [mesh])

  useFrame(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.color.set(selected ? '#fbbf24' : '#4fd1c5')
    }
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      onClick={e => {
        e.stopPropagation()
        if (e.shiftKey) {
          if (selection.objectIds.includes(objectId)) {
            setSelection({ ...selection, objectIds: selection.objectIds.filter(id => id !== objectId) })
          } else {
            setSelection({ ...selection, objectIds: [...selection.objectIds, objectId] })
          }
        } else {
          setSelection({ ...selection, objectIds: [objectId] })
        }
      }}
    >
      <meshStandardMaterial color={selected ? '#fbbf24' : '#4fd1c5'} />
    </mesh>
  )
}

function VertexSpheres({ mesh, selectedIds, onSelect }: { mesh: any, selectedIds: string[], onSelect: (vertexId: string, e: any) => void }) {
  return Object.values(mesh.vertices).map((v: any) => (
    <mesh
      key={v.id}
      position={v.position}
      onClick={e => {
        e.stopPropagation()
        onSelect(v.id, e)
      }}
    >
      <sphereGeometry args={[0.045, 16, 16]} />
      <meshStandardMaterial color={selectedIds.includes(v.id) ? '#fbbf24' : '#38bdf8'} />
    </mesh>
  ))
}

function EdgeLines({ mesh, selectedIds, onSelect }: { mesh: any, selectedIds: string[], onSelect: (edgeId: string, e: any) => void }) {
  return Object.values(mesh.edges).map((e: any) => {
    const v1 = mesh.vertices[e.v1]
    const v2 = mesh.vertices[e.v2]
    if (!v1 || !v2) return null
    const array = new Float32Array([...v1.position, ...v2.position])
    return (
      <line
        key={e.id}
        onClick={evt => {
          evt.stopPropagation()
          onSelect(e.id, evt)
        }}
      >
        <bufferGeometry attach="geometry">
          <bufferAttribute attach="attributes-position" itemSize={3} args={[array, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={selectedIds.includes(e.id) ? '#fbbf24' : '#38bdf8'} linewidth={2} />
      </line>
    )
  })
}

function FaceMeshes({ mesh, selectedIds, onSelect }: { mesh: any, selectedIds: string[], onSelect: (faceId: string, e: any) => void }) {
  return Object.values(mesh.faces).map((f: any) => {
    if (f.vertices.length !== 3) return null // Only triangles for now
    const v0 = mesh.vertices[f.vertices[0]]
    const v1 = mesh.vertices[f.vertices[1]]
    const v2 = mesh.vertices[f.vertices[2]]
    if (!v0 || !v1 || !v2) return null
    const array = new Float32Array([...v0.position, ...v1.position, ...v2.position])
    return (
      <mesh
        key={f.id}
        position={[0, 0, 0]}
        onClick={evt => {
          evt.stopPropagation()
          onSelect(f.id, evt)
        }}
      >
        <bufferGeometry attach="geometry">
          <bufferAttribute attach="attributes-position" itemSize={3} args={[array, 3]} />
        </bufferGeometry>
        <meshStandardMaterial
          color={selectedIds.includes(f.id) ? '#fbbf24' : '#38bdf8'}
          opacity={selectedIds.includes(f.id) ? 0.6 : 0.25}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
    )
  })
}

export default function ViewportCanvas() {
  const scene = useEditorStore((s) => s.scene)
  const selection = useEditorStore((s) => s.selection)
  const setSelection = useEditorStore((s) => s.setSelection)
  const cameraType = useEditorStore((s) => s.cameraType)
  const mode = useEditorStore((s) => s.mode)

  const meshes: React.ReactNode[] = useMemo(() => {
    if (!scene) return []
    return Object.entries(scene.objects)
      .filter(([, obj]) => obj.type === 'mesh' && obj.meshId)
      .map(([objectId, obj]) => (
        <SelectableMesh
          key={objectId}
          objectId={objectId}
          mesh={scene.meshes[(obj as any).meshId]}
          selected={selection.objectIds.includes(objectId)}
        />
      ))
  }, [scene, selection.objectIds])

  // Edit mode: render mesh elements for selected mesh object
  let editElements: React.ReactNode = null
  if (scene && selection.objectIds.length === 1) {
    const obj = scene.objects[selection.objectIds[0]]
    if (obj && obj.meshId) {
      const mesh = scene.meshes[obj.meshId]
      if (mode === 'edit-vertex') {
        editElements = (
          <VertexSpheres
            mesh={mesh}
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
          />
        )
      } else if (mode === 'edit-edge') {
        editElements = (
          <EdgeLines
            mesh={mesh}
            selectedIds={selection.elementType === 'edge' && selection.elementIds ? selection.elementIds : []}
            onSelect={(edgeId, e) => {
              if (e.shiftKey) {
                if (selection.elementType === 'edge' && selection.elementIds?.includes(edgeId)) {
                  setSelection({ ...selection, elementType: 'edge', elementIds: selection.elementIds!.filter(id => id !== edgeId) })
                } else {
                  setSelection({ ...selection, elementType: 'edge', elementIds: [...(selection.elementIds || []), edgeId] })
                }
              } else {
                setSelection({ ...selection, elementType: 'edge', elementIds: [edgeId] })
              }
            }}
          />
        )
      } else if (mode === 'edit-face') {
        editElements = (
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
          />
        )
      }
    }
  }

  // Deselect on canvas background click
  function handlePointerMissed() {
    if (mode === 'object') {
      setSelection({ ...selection, objectIds: [] })
    } else if (mode === 'edit-vertex') {
      setSelection({ ...selection, elementType: 'vertex', elementIds: [] })
    } else if (mode === 'edit-edge') {
      setSelection({ ...selection, elementType: 'edge', elementIds: [] })
    } else if (mode === 'edit-face') {
      setSelection({ ...selection, elementType: 'face', elementIds: [] })
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 relative">
        <Canvas onPointerMissed={handlePointerMissed}>
          {cameraType === 'perspective' ? (
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          ) : (
            <OrthographicCamera makeDefault position={[0, 0, 5]} zoom={100} near={0.1} far={1000} />
          )}
          <OrbitControls />
          <gridHelper args={[10, 10]} />
          {meshes}
          {editElements}
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={0.7} />
        </Canvas>
      </div>
      <CameraBar />
    </div>
  )
} 