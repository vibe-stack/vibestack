import { useThree } from "@react-three/fiber";
import { useState } from "react";
import * as THREE from "three";
import { findMeshLoops } from "./find-mesh-loops";
import { Line } from "@react-three/drei";
import { useEditorStore } from "../../../editor/store";

export function LoopCutOverlay({
  mesh,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  onEdgeHover,
  onEdgeClick,
}: {
  mesh: any;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  onEdgeHover?: (edgeId: string | null) => void;
  onEdgeClick?: (edgeId: string, t: number) => void;
}) {
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [hoverT, setHoverT] = useState<number>(0.5);
  const { camera, gl } = useThree();
  const scene = useEditorStore((s) => s.scene);
  const selection = useEditorStore((s) => s.selection);
  const runLoopCut = useEditorStore((s) => s.performLoopCut);

  // Helper to transform vertices to world space
  const group = new THREE.Group();
  group.position.fromArray(position);
  group.rotation.fromArray(rotation);
  group.scale.fromArray(scale);
  group.updateMatrixWorld();

  function getUniqueEdges(mesh: any) {
    const edgeSet = new Set<string>()
    const edgeList: { id: string, v1: string, v2: string }[] = []
    for (const he of Object.values(mesh.halfEdges) as any[]) {
      const vA = mesh.halfEdges[he.id].vertex
      const vB = mesh.halfEdges[he.pair]?.vertex
      if (!vB) continue // skip boundary
      const key = [vA, vB].sort().join("-")
      if (!edgeSet.has(key)) {
        edgeSet.add(key)
        edgeList.push({ id: he.id, v1: vA, v2: vB })
      }
    }
    return edgeList
  }

  function handlePointerMove(edgeId: string, e: any) {
    const he = mesh.halfEdges[edgeId]
    if (!he || !he.pair) return
    const v1 = mesh.vertices[he.vertex]
    const v2 = mesh.vertices[mesh.halfEdges[he.pair].vertex]
    if (!v1 || !v2) return
    const mouse = new THREE.Vector2(
      (e.clientX / gl.domElement.clientWidth) * 2 - 1,
      -(e.clientY / gl.domElement.clientHeight) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const worldV1 = new THREE.Vector3()
      .fromArray(v1.position)
      .applyMatrix4(group.matrixWorld);
    const worldV2 = new THREE.Vector3()
      .fromArray(v2.position)
      .applyMatrix4(group.matrixWorld);
    const edgeDir = new THREE.Vector3().subVectors(worldV2, worldV1);
    const edgeLength = edgeDir.length();
    edgeDir.normalize();
    const rayOrigin = raycaster.ray.origin;
    const rayDir = raycaster.ray.direction;
    const v1ToRayOrigin = new THREE.Vector3().subVectors(rayOrigin, worldV1);
    const d1 = v1ToRayOrigin.dot(edgeDir);
    const d2 = v1ToRayOrigin.dot(rayDir);
    const d3 = edgeDir.dot(rayDir);
    const denom = 1 - d3 * d3;
    if (Math.abs(denom) < 0.0001) return;
    const t = (d1 - d2 * d3) / denom;
    const tClamped = Math.max(0, Math.min(1, t / edgeLength));
    setHoverT(tClamped);
    setHoveredEdge(edgeId);
    if (onEdgeHover) onEdgeHover(edgeId);
  }

  function handlePointerOut() {
    setHoveredEdge(null);
    if (onEdgeHover) onEdgeHover(null);
  }

  function handleClick(edgeId: string) {
    if (onEdgeClick) onEdgeClick(edgeId, hoverT);
  }

  // Use the utility to find all loops
  const loops = findMeshLoops(mesh);
  let hoveredLoop: string[] | null = null;
  if (hoveredEdge) {
    let maxLength = 0;
    for (const loop of loops) {
      if (loop.includes(hoveredEdge) && loop.length > maxLength) {
        hoveredLoop = loop;
        maxLength = loop.length;
      }
    }
  }

  // Compute the list of faces and their cut edges for the hovered loop
  type LoopCutFace = { faceId: string; edgeA: string; edgeB: string };
  const loopCutFaces: LoopCutFace[] = [];
  if (hoveredLoop && hoveredEdge) {
    // For each face, find the two loop edges in the face
    const faceToLoopEdges: Record<string, string[]> = {};
    for (const edgeId of hoveredLoop) {
      for (const faceId in mesh.faces) {
        const face = mesh.faces[faceId];
        if (!face) continue;
        const heStart = face.halfEdge
        let heId = heStart
        do {
          if (heId === edgeId || mesh.halfEdges[heId].pair === edgeId) {
            if (!faceToLoopEdges[faceId]) faceToLoopEdges[faceId] = [];
            faceToLoopEdges[faceId].push(edgeId);
            break;
          }
          heId = mesh.halfEdges[heId].next
        } while (heId !== heStart)
      }
    }
    for (const faceId in faceToLoopEdges) {
      const loopEdges = faceToLoopEdges[faceId];
      if (loopEdges.length !== 2) continue;
      loopCutFaces.push({ faceId, edgeA: loopEdges[0], edgeB: loopEdges[1] });
    }
  }

  const performLoopCut = () => {
    if (!scene || !selection.objectIds.length || !loopCutFaces.length) return;
    const objId = selection.objectIds[0];
    const meshId = scene.objects[objId]?.meshId;
    if (!meshId) return;
    runLoopCut();
  };

  return (
    <group
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={() => {
        if (loopCutFaces.length > 0) performLoopCut();
      }}
    >
      {getUniqueEdges(mesh).map((e: any) => {
        const v1 = mesh.vertices[e.v1];
        const v2 = mesh.vertices[e.v2];
        if (!v1 || !v2) return null;
        return (
          <Line
            key={e.id}
            points={[v1.position, v2.position]}
            color={hoveredEdge === e.id ? "#22c55e" : "#888888"}
            lineWidth={2}
            onPointerMove={(evt) => handlePointerMove(e.id, evt)}
            onPointerOut={handlePointerOut}
            onClick={() => handleClick(e.id)}
          />
        );
      })}
      {hoveredLoop && hoveredLoop.length > 1 && (
        <Line
          points={(() => {
            const points = hoveredLoop.map((edgeId) => {
              const he = mesh.halfEdges[edgeId]
              const v1 = mesh.vertices[he.vertex]
              return v1 ? v1.position : [0, 0, 0]
            })
            if (points.length > 1) points.push(points[0])
            return points.flat()
          })()}
          color="#fbbf24"
          lineWidth={3}
        />
      )}
    </group>
  );
}
