import { useThree } from "@react-three/fiber";
import { useEditorStore } from "../../../editor/store";
import { useState, useRef } from "react";
import * as THREE from "three";
import { useOrbitControls } from "../use-orbit-controls";

export function VertexSpheres({
  meshId,
  selectedIds,
  onSelect,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
}: {
  meshId: string;
  selectedIds: string[];
  onSelect: (vertexId: string, e: any) => void;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}) {
  const setScene = useEditorStore((s) => s.setScene);
  const scene = useEditorStore((s) => s.scene);
  const selection = useEditorStore((s) => s.selection);
  const mesh = useEditorStore((s) => (s.scene ? s.scene.meshes[meshId] : null));
  const { camera, gl } = useThree();
  const [, _setDragging] = useState<string | null>(null);
  const draggingRef = useRef<string | null>(null);
  const dragStartIntersection = useRef<[number, number, number] | null>(null);
  const dragPlaneNormal = useRef<[number, number, number] | null>(null);
  const originalPositions = useRef<Record<string, [number, number, number]>>(
    {}
  );
  const [, setOrbitEnabled] = useOrbitControls();

  if (!mesh) return null;

  function setDragging(val: string | null) {
    draggingRef.current = val;
    _setDragging(val);
  }

  function handlePointerDown(vertexId: string, e: any) {
    if (!mesh || !selectedIds.includes(vertexId)) return;
    setDragging(vertexId);
    setOrbitEnabled(false);
    gl.domElement.style.cursor = "grabbing";
    // Store offset between mouse and vertex position
    const vertex = mesh.vertices[vertexId];
    const mouse = new THREE.Vector2(
      (e.clientX / gl.domElement.clientWidth) * 2 - 1,
      -(e.clientY / gl.domElement.clientHeight) * 2 + 1
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(mouse, camera);
    // Camera-aligned drag plane
    const planeNormal = camera
      .getWorldDirection(new THREE.Vector3())
      .normalize();
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      planeNormal,
      new THREE.Vector3(...vertex.position)
    );
    const intersection = new THREE.Vector3();
    ray.ray.intersectPlane(plane, intersection);
    dragStartIntersection.current = [
      intersection.x,
      intersection.y,
      intersection.z,
    ];
    dragPlaneNormal.current = [planeNormal.x, planeNormal.y, planeNormal.z];
    // Store original positions of all selected vertices
    const selected =
      selection.elementType === "vertex" &&
      selection.elementIds &&
      selection.elementIds.length > 0
        ? selection.elementIds
        : [vertexId];
    originalPositions.current = {};
    for (const vid of selected) {
      originalPositions.current[vid] = mesh.vertices[vid].position.slice() as [
        number,
        number,
        number,
      ];
    }
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  function handlePointerMove(e: PointerEvent) {
    const dragging = draggingRef.current;
    if (!dragging || !scene || !mesh) return;
    const meshId = Object.values(scene.meshes).find(
      (m) => m.vertices[dragging]
    )?.id;
    if (!meshId) return;
    const meshCopy = JSON.parse(JSON.stringify(scene.meshes[meshId]));
    const mouse = new THREE.Vector2(
      (e.clientX / gl.domElement.clientWidth) * 2 - 1,
      -(e.clientY / gl.domElement.clientHeight) * 2 + 1
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(mouse, camera);
    if (!dragStartIntersection.current || !dragPlaneNormal.current) return;
    const planeNormal = new THREE.Vector3(...dragPlaneNormal.current);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      planeNormal,
      new THREE.Vector3(...dragStartIntersection.current)
    );
    const intersection = new THREE.Vector3();
    ray.ray.intersectPlane(plane, intersection);
    // Compute delta from drag start in world space
    const deltaWorld = new THREE.Vector3(
      intersection.x - dragStartIntersection.current[0],
      intersection.y - dragStartIntersection.current[1],
      intersection.z - dragStartIntersection.current[2],
    );
    // Transform delta to local space
    const group = new THREE.Group();
    group.position.fromArray(position);
    group.rotation.fromArray(rotation);
    group.scale.fromArray(scale);
    group.updateMatrixWorld();
    const invMatrix = new THREE.Matrix4().copy(group.matrixWorld).invert();
    const deltaLocal = deltaWorld.clone().applyMatrix4(invMatrix).sub(new THREE.Vector3().applyMatrix4(invMatrix));
    // Multi-vertex drag: update all selected vertices, or just the dragged one if none selected
    const selected =
      selection.elementType === "vertex" &&
      selection.elementIds &&
      selection.elementIds.length > 0
        ? selection.elementIds
        : [dragging];
    for (const vid of selected) {
      const orig = originalPositions.current[vid];
      if (!orig) continue;
      meshCopy.vertices[vid] = {
        ...meshCopy.vertices[vid],
        position: [orig[0] + deltaLocal.x, orig[1] + deltaLocal.y, orig[2] + deltaLocal.z],
      };
    }
    setScene({
      ...scene,
      meshes: {
        ...scene.meshes,
        [meshId]: meshCopy,
      },
    });
  }

  function handlePointerUp() {
    setDragging(null);
    setOrbitEnabled(true);
    gl.domElement.style.cursor = "";
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }

  // Helper: compute scale so cube stays same size in screen space
  function getScreenScale(position: [number, number, number], size = 0.045) {
    const cam = camera as THREE.PerspectiveCamera;
    if (cam.isPerspectiveCamera) {
      const dist = new THREE.Vector3(...position).distanceTo(cam.position);
      const vFOV = (cam.fov * Math.PI) / 180;
      const height = 2 * Math.tan(vFOV / 2) * dist;
      return (size * height) / gl.domElement.clientHeight;
    }
    return size * (cam as any).zoom;
  }

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {Object.values(mesh.vertices).map((v: any) => {
        const color = selectedIds.includes(v.id) ? "#fbbf24" : "#888888";
        const scaleVal = getScreenScale(v.position, 0.5);
        return (
          <mesh
            key={v.id}
            position={v.position}
            scale={[scaleVal, scaleVal, scaleVal]}
            onPointerDown={(e) => handlePointerDown(v.id, e)}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(v.id, e);
            }}
          >
            <boxGeometry args={[10, 10, 10]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );
      })}
    </group>
  );
}

export function EdgeLines({
  mesh,
  selectedIds,
  onSelect,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  edgeColor,
}: {
  mesh: any;
  selectedIds: string[];
  onSelect: (edgeId: string, e: any) => void;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  edgeColor?: string;
}) {
  const setScene = useEditorStore((s) => s.setScene);
  const scene = useEditorStore((s) => s.scene);
  const selection = useEditorStore((s) => s.selection);
  const { camera, gl } = useThree();
  const [, _setDragging] = useState<string | null>(null);
  const draggingRef = useRef<string | null>(null);
  const dragStartIntersection = useRef<[number, number, number] | null>(null);
  const originalPositions = useRef<Record<string, [number, number, number]>>(
    {}
  );
  const [, setOrbitEnabled] = useOrbitControls();

  function setDragging(val: string | null) {
    draggingRef.current = val;
    _setDragging(val);
  }

  function handlePointerDown(edgeId: string, e: any) {
    if (!selectedIds.includes(edgeId)) return;
    setDragging(edgeId);
    setOrbitEnabled(false);
    gl.domElement.style.cursor = "grabbing";
    // Get all unique vertex ids involved in selected edges
    const selectedEdges =
      selection.elementType === "edge" &&
      selection.elementIds &&
      selection.elementIds.length > 0
        ? selection.elementIds
        : [edgeId];
    const vertexIds = new Set<string>();
    for (const eid of selectedEdges) {
      const edge = mesh.edges[eid];
      if (edge) {
        vertexIds.add(edge.v1);
        vertexIds.add(edge.v2);
      }
    }
    // Store original positions
    originalPositions.current = {};
    for (const vid of vertexIds) {
      originalPositions.current[vid] = mesh.vertices[vid].position.slice() as [
        number,
        number,
        number,
      ];
    }
    // Store drag start intersection
    // Use the midpoint of the first edge as the drag plane
    const firstEdge = mesh.edges[edgeId];
    const v1 = mesh.vertices[firstEdge.v1];
    const v2 = mesh.vertices[firstEdge.v2];
    const mid = [
      (v1.position[0] + v2.position[0]) / 2,
      (v1.position[1] + v2.position[1]) / 2,
      (v1.position[2] + v2.position[2]) / 2,
    ];
    const mouse = new THREE.Vector2(
      (e.clientX / gl.domElement.clientWidth) * 2 - 1,
      -(e.clientY / gl.domElement.clientHeight) * 2 + 1
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(mouse, camera);
    const planeNormal = camera
      .getWorldDirection(new THREE.Vector3())
      .normalize();
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      planeNormal,
      new THREE.Vector3(...mid)
    );
    const intersection = new THREE.Vector3();
    ray.ray.intersectPlane(plane, intersection);
    dragStartIntersection.current = [
      intersection.x,
      intersection.y,
      intersection.z,
    ];
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  function handlePointerMove(e: PointerEvent) {
    const dragging = draggingRef.current;
    if (!dragging || !scene || !mesh) return;
    const meshId = mesh.id;
    const meshCopy = JSON.parse(JSON.stringify(mesh));
    // Get all unique vertex ids involved in selected edges
    const selectedEdges =
      selection.elementType === "edge" &&
      selection.elementIds &&
      selection.elementIds.length > 0
        ? selection.elementIds
        : [dragging];
    const vertexIds = new Set<string>();
    for (const eid of selectedEdges) {
      const edge = mesh.edges[eid];
      if (edge) {
        vertexIds.add(edge.v1);
        vertexIds.add(edge.v2);
      }
    }
    // Drag plane: use camera-aligned plane through the midpoint of the first edge
    if (!dragStartIntersection.current) return;
    const mouse = new THREE.Vector2(
      (e.clientX / gl.domElement.clientWidth) * 2 - 1,
      -(e.clientY / gl.domElement.clientHeight) * 2 + 1
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(mouse, camera);
    const planeNormal = camera
      .getWorldDirection(new THREE.Vector3())
      .normalize();
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      planeNormal,
      new THREE.Vector3(...dragStartIntersection.current)
    );
    const intersection = new THREE.Vector3();
    ray.ray.intersectPlane(plane, intersection);
    // Compute delta from drag start in world space
    const deltaWorld = new THREE.Vector3(
      intersection.x - dragStartIntersection.current[0],
      intersection.y - dragStartIntersection.current[1],
      intersection.z - dragStartIntersection.current[2],
    );
    // Transform delta to local space
    const group = new THREE.Group();
    group.position.fromArray(position);
    group.rotation.fromArray(rotation);
    group.scale.fromArray(scale);
    group.updateMatrixWorld();
    const invMatrix = new THREE.Matrix4().copy(group.matrixWorld).invert();
    const deltaLocal = deltaWorld.clone().applyMatrix4(invMatrix).sub(new THREE.Vector3().applyMatrix4(invMatrix));
    for (const vid of vertexIds) {
      const orig = originalPositions.current[vid];
      if (!orig) continue;
      meshCopy.vertices[vid] = {
        ...meshCopy.vertices[vid],
        position: [orig[0] + deltaLocal.x, orig[1] + deltaLocal.y, orig[2] + deltaLocal.z],
      };
    }
    setScene({
      ...scene,
      meshes: {
        ...scene.meshes,
        [meshId]: meshCopy,
      },
    });
  }

  function handlePointerUp() {
    setDragging(null);
    setOrbitEnabled(true);
    gl.domElement.style.cursor = "";
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }

  const array = (v1: any, v2: any) =>
    new Float32Array([...v1.position, ...v2.position]);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {Object.values(mesh.edges).map((e: any) => {
        const v1 = mesh.vertices[e.v1];
        const v2 = mesh.vertices[e.v2];
        if (!v1 || !v2) return null;
        const pointerEvents =
          selectedIds.length > 0
            ? {
                onPointerDown: (evt: any) => handlePointerDown(e.id, evt),
                onClick: (evt: any) => {
                  evt.stopPropagation();
                  onSelect(e.id, evt);
                },
              }
            : undefined;
        return (
          <line key={e.id} {...pointerEvents}>
            <bufferGeometry attach="geometry">
              <bufferAttribute
                attach="attributes-position"
                itemSize={3}
                args={[array(v1, v2), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={selectedIds.includes(e.id) ? "#fbbf24" : "#888888"}
              linewidth={2}
            />
          </line>
        );
      })}
    </group>
  );
}

export function FaceMeshes({
  mesh,
  selectedIds,
  onSelect,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
}: {
  mesh: any;
  selectedIds: string[];
  onSelect: (faceId: string, e: any) => void;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}) {
  const setScene = useEditorStore((s) => s.setScene);
  const scene = useEditorStore((s) => s.scene);
  const selection = useEditorStore((s) => s.selection);
  const { camera, gl } = useThree();
  const [, _setDragging] = useState<string | null>(null);
  const draggingRef = useRef<string | null>(null);
  const dragStartIntersection = useRef<[number, number, number] | null>(null);
  const dragPlaneNormal = useRef<[number, number, number] | null>(null);
  const originalPositions = useRef<Record<string, [number, number, number]>>(
    {}
  );
  const [, setOrbitEnabled] = useOrbitControls();

  function setDragging(val: string | null) {
    draggingRef.current = val;
    _setDragging(val);
  }

  function handlePointerDown(faceId: string, e: any) {
    if (!selectedIds.includes(faceId)) return;
    setDragging(faceId);
    setOrbitEnabled(false);
    gl.domElement.style.cursor = "grabbing";
    // Get all unique vertex ids involved in selected faces
    const selectedFaces =
      selection.elementType === "face" &&
      selection.elementIds &&
      selection.elementIds.length > 0
        ? selection.elementIds
        : [faceId];
    const vertexIds = new Set<string>();
    for (const fid of selectedFaces) {
      const face = mesh.faces[fid];
      if (face) {
        for (const vid of face.vertices) vertexIds.add(vid);
      }
    }
    // Store original positions
    originalPositions.current = {};
    for (const vid of vertexIds) {
      originalPositions.current[vid] = mesh.vertices[vid].position.slice() as [
        number,
        number,
        number,
      ];
    }
    // Drag plane: use camera-aligned plane through the centroid of the first face
    const face = mesh.faces[faceId];
    const centroidArr = face.vertices.reduce(
      (acc: [number, number, number], vid: string) => {
        const v = mesh.vertices[vid].position;
        return [acc[0] + v[0], acc[1] + v[1], acc[2] + v[2]];
      },
      [0, 0, 0]
    );
    const centroid = centroidArr.map(
      (x: number) => x / face.vertices.length
    ) as [number, number, number];
    const mouse = new THREE.Vector2(
      (e.clientX / gl.domElement.clientWidth) * 2 - 1,
      -(e.clientY / gl.domElement.clientHeight) * 2 + 1
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(mouse, camera);
    const planeNormal = camera
      .getWorldDirection(new THREE.Vector3())
      .normalize();
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      planeNormal,
      new THREE.Vector3(...centroid)
    );
    const intersection = new THREE.Vector3();
    ray.ray.intersectPlane(plane, intersection);
    dragStartIntersection.current = [
      intersection.x,
      intersection.y,
      intersection.z,
    ];
    dragPlaneNormal.current = [planeNormal.x, planeNormal.y, planeNormal.z];
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  function handlePointerMove(e: PointerEvent) {
    const dragging = draggingRef.current;
    if (!dragging || !scene || !mesh) return;
    const meshId = mesh.id;
    const meshCopy = JSON.parse(JSON.stringify(mesh));
    // Get all unique vertex ids involved in selected faces
    const selectedFaces =
      selection.elementType === "face" &&
      selection.elementIds &&
      selection.elementIds.length > 0
        ? selection.elementIds
        : [dragging];
    const vertexIds = new Set<string>();
    for (const fid of selectedFaces) {
      const face = mesh.faces[fid];
      if (face) {
        for (const vid of face.vertices) vertexIds.add(vid);
      }
    }
    if (!dragStartIntersection.current || !dragPlaneNormal.current) return;
    const mouse = new THREE.Vector2(
      (e.clientX / gl.domElement.clientWidth) * 2 - 1,
      -(e.clientY / gl.domElement.clientHeight) * 2 + 1
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(mouse, camera);
    const planeNormal = new THREE.Vector3(...dragPlaneNormal.current);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      planeNormal,
      new THREE.Vector3(...dragStartIntersection.current)
    );
    const intersection = new THREE.Vector3();
    ray.ray.intersectPlane(plane, intersection);
    // Compute delta from drag start in world space
    const deltaWorld = new THREE.Vector3(
      intersection.x - dragStartIntersection.current[0],
      intersection.y - dragStartIntersection.current[1],
      intersection.z - dragStartIntersection.current[2],
    );
    // Transform delta to local space
    const group = new THREE.Group();
    group.position.fromArray(position);
    group.rotation.fromArray(rotation);
    group.scale.fromArray(scale);
    group.updateMatrixWorld();
    const invMatrix = new THREE.Matrix4().copy(group.matrixWorld).invert();
    const deltaLocal = deltaWorld.clone().applyMatrix4(invMatrix).sub(new THREE.Vector3().applyMatrix4(invMatrix));
    for (const vid of vertexIds) {
      const orig = originalPositions.current[vid];
      if (!orig) continue;
      meshCopy.vertices[vid] = {
        ...meshCopy.vertices[vid],
        position: [orig[0] + deltaLocal.x, orig[1] + deltaLocal.y, orig[2] + deltaLocal.z],
      };
    }
    setScene({
      ...scene,
      meshes: {
        ...scene.meshes,
        [meshId]: meshCopy,
      },
    });
  }

  function handlePointerUp() {
    setDragging(null);
    setOrbitEnabled(true);
    gl.domElement.style.cursor = "";
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {Object.values(mesh.faces).map((f: any) => {
        if (f.vertices.length !== 3) return null; // Only triangles for now
        const v0 = mesh.vertices[f.vertices[0]];
        const v1 = mesh.vertices[f.vertices[1]];
        const v2 = mesh.vertices[f.vertices[2]];
        if (!v0 || !v1 || !v2) return null;
        const array = new Float32Array([
          ...v0.position,
          ...v1.position,
          ...v2.position,
        ]);
        return (
          <group key={f.id}>
            {/* Invisible mesh for picking, double-sided, not transparent */}
            <mesh
              position={[0, 0, 0]}
              onPointerDown={(evt) => handlePointerDown(f.id, evt)}
              onClick={(evt) => {
                evt.stopPropagation();
                onSelect(f.id, evt);
              }}
            >
              <bufferGeometry attach="geometry">
                <bufferAttribute
                  attach="attributes-position"
                  itemSize={3}
                  args={[array, 3]}
                />
              </bufferGeometry>
              <meshBasicMaterial
                color="#ffffff"
                opacity={0}
                transparent
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            {/* Visible mesh for display */}
            <mesh position={[0, 0, 0]}>
              <bufferGeometry attach="geometry">
                <bufferAttribute
                  attach="attributes-position"
                  itemSize={3}
                  args={[array, 3]}
                />
              </bufferGeometry>
              <meshStandardMaterial
                color={selectedIds.includes(f.id) ? "#fbbf24" : "#888888"}
                opacity={selectedIds.includes(f.id) ? 0.6 : 0.25}
                transparent
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
