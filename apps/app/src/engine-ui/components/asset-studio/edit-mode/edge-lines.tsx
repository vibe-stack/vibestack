import { useEditorStore } from "../../../editor/store";
import { useThree } from "@react-three/fiber";
import { useState, useRef } from "react";
import * as THREE from "three";
import { useOrbitControls } from "../use-orbit-controls";
import { Line } from "@react-three/drei";

export function EdgeLines({
  mesh,
  selectedIds,
  onSelect,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  edgeColor = "#888888",
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
  const [hoveredId, setHoveredId] = useState<string | null>(null); // Track hover state
  const draggingRef = useRef<string | null>(null);
  const dragStartIntersection = useRef<[number, number, number] | null>(null);
  const originalPositions = useRef<Record<string, [number, number, number]>>({});
  const [, setOrbitEnabled] = useOrbitControls();
  const dragPlaneNormal = useRef<[number, number, number] | null>(null);

  function setDragging(val: string | null) {
    draggingRef.current = val;
    _setDragging(val);
  }

  function handlePointerDown(edgeId: string, e: any) {
    if (!selectedIds.includes(edgeId)) return;
    setDragging(edgeId);
    setOrbitEnabled(false);
    gl.domElement.style.cursor = "grabbing";
    const selectedEdges =
      selection.elementType === "edge" && (selection.elementIds?.length ?? 0) > 0
        ? selection.elementIds!
        : [edgeId];
    const vertexIds = new Set<string>();
    for (const eid of selectedEdges) {
      const edge = mesh.edges[eid];
      if (edge) {
        vertexIds.add(edge.v1);
        vertexIds.add(edge.v2);
      }
    }
    originalPositions.current = {};
    for (const vid of vertexIds) {
      originalPositions.current[vid] = mesh.vertices[vid].position.slice() as [
        number,
        number,
        number
      ];
    }
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
    dragPlaneNormal.current = [planeNormal.x, planeNormal.y, planeNormal.z];
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  function handlePointerMove(e: PointerEvent) {
    const dragging = draggingRef.current;
    if (!dragging || !scene || !mesh) return;
    const meshId = mesh.id;
    const meshCopy = JSON.parse(JSON.stringify(mesh));
    const selectedEdges =
      selection.elementType === "edge" && (selection.elementIds?.length ?? 0) > 0
        ? selection.elementIds!
        : [dragging];
    const vertexIds = new Set<string>();
    for (const eid of selectedEdges) {
      const edge = mesh.edges[eid];
      if (edge) {
        vertexIds.add(edge.v1);
        vertexIds.add(edge.v2);
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
    const deltaWorld = new THREE.Vector3(
      intersection.x - dragStartIntersection.current[0],
      intersection.y - dragStartIntersection.current[1],
      intersection.z - dragStartIntersection.current[2]
    );
    const group = new THREE.Group();
    group.position.fromArray(position);
    group.rotation.fromArray(rotation);
    group.scale.fromArray(scale);
    group.updateMatrixWorld();
    const invMatrix = new THREE.Matrix4().copy(group.matrixWorld).invert();
    const deltaLocal = deltaWorld
      .clone()
      .applyMatrix4(invMatrix)
      .sub(new THREE.Vector3().applyMatrix4(invMatrix));
    for (const vid of vertexIds) {
      const orig = originalPositions.current[vid];
      if (!orig) continue;
      meshCopy.vertices[vid] = {
        ...meshCopy.vertices[vid],
        position: [
          orig[0] + deltaLocal.x,
          orig[1] + deltaLocal.y,
          orig[2] + deltaLocal.z,
        ],
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
      {Object.values(mesh.edges).map((e: any) => {
        const v1 = mesh.vertices[e.v1];
        const v2 = mesh.vertices[e.v2];
        if (!v1 || !v2) return null;

        // Determine color based on hover or selection
        const isSelected = selectedIds.includes(e.id);
        const isHovered = hoveredId === e.id;
        const color = isSelected || isHovered ? "#f97316" : edgeColor;

        return (
          <Line
            key={e.id}
            points={[v1.position, v2.position]}
            color={color}
            lineWidth={3}
            dashed={false}
            onPointerDown={(evt) => {
              evt.stopPropagation();
              handlePointerDown(e.id, evt);
            }}
            onClick={(evt) => {
              evt.stopPropagation();
              onSelect(e.id, evt);
            }}
            onPointerOver={(evt) => {
              evt.stopPropagation();
              setHoveredId(e.id);
            }}
            onPointerOut={(evt) => {
              evt.stopPropagation();
              setHoveredId(null);
            }}
          />
        );
      })}
    </group>
  );
}