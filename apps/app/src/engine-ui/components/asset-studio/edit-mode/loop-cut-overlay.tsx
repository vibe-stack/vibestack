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

  function handlePointerMove(edgeId: string, e: any) {
    const edge = mesh.edges[edgeId];
    if (!edge) return;
    const v1 = mesh.vertices[edge.v1];
    const v2 = mesh.vertices[edge.v2];
    if (!v1 || !v2) return;
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
    hoveredLoop = loops.find((loop) => loop.includes(hoveredEdge)) || null;
  }

  const loopCutPoints: [number, number, number][] = [];
  const cutData: { faceId: string; cutA: [number, number, number]; cutB: [number, number, number]; edgeA: string; edgeB: string }[] = [];
  if (hoveredLoop && hoveredEdge) {
    for (const edgeId of hoveredLoop) {
      const edge = mesh.edges[edgeId];
      if (!edge) continue;
      const face = Object.values(mesh.faces).find((f) => {
        const face = f as any;
        return (
          face.vertices.length === 4 &&
          face.vertices.includes(edge.v1) &&
          face.vertices.includes(edge.v2)
        );
      });
      if (!face) continue;
      const f = face as any;
      const v1Index = f.vertices.indexOf(edge.v1);
      const v2Index = f.vertices.indexOf(edge.v2);
      if (v1Index === -1 || v2Index === -1) continue;
      if (
        Math.abs(v1Index - v2Index) !== 1 &&
        Math.abs(v1Index - v2Index) !== 3
      )
        continue;
      const edgeVerts = [edge.v1, edge.v2];
      const oppVerts = f.vertices.filter(
        (vid: string) => !edgeVerts.includes(vid)
      );
      if (oppVerts.length !== 2) continue;
      const aPos = mesh.vertices[oppVerts[0]]?.position;
      const bPos = mesh.vertices[oppVerts[1]]?.position;
      if (!aPos || !bPos) continue;
      const center: [number, number, number] = [
        (aPos[0] + bPos[0]) / 2,
        (aPos[1] + bPos[1]) / 2,
        (aPos[2] + bPos[2]) / 2,
      ];
      loopCutPoints.push(center);
      // For the cut, we need the two edges crossed and the cut points on them
      // Find the two edges: the current edge and the opposite edge in the face
      const edgeA = edgeId;
      const edgeB = Object.keys(mesh.edges).find((eid) => {
        const e = mesh.edges[eid];
        return (
          (e.v1 === oppVerts[0] && e.v2 === oppVerts[1]) ||
          (e.v1 === oppVerts[1] && e.v2 === oppVerts[0])
        );
      });
      if (!edgeB) continue;
      // Interpolate cut points on both edges
      const vA1 = mesh.vertices[edge.v1].position;
      const vA2 = mesh.vertices[edge.v2].position;
      const cutA: [number, number, number] = [
        vA1[0] + (vA2[0] - vA1[0]) * hoverT,
        vA1[1] + (vA2[1] - vA1[1]) * hoverT,
        vA1[2] + (vA2[2] - vA1[2]) * hoverT,
      ];
      const vB1 = mesh.vertices[oppVerts[0]].position;
      const vB2 = mesh.vertices[oppVerts[1]].position;
      const cutB: [number, number, number] = [
        vB1[0] + (vB2[0] - vB1[0]) * hoverT,
        vB1[1] + (vB2[1] - vB1[1]) * hoverT,
        vB1[2] + (vB2[2] - vB1[2]) * hoverT,
      ];
      cutData.push({ faceId: f.id, cutA, cutB, edgeA, edgeB });
    }
    if (loopCutPoints.length > 2) {
      loopCutPoints.push(loopCutPoints[0]);
    }
  }

  const performLoopCut = () => {
    if (!scene || !selection.objectIds.length || !hoveredLoop || cutData.length === 0) return;
    const objId = selection.objectIds[0];
    const meshId = scene.objects[objId]?.meshId;
    if (!meshId) return;
    console.log("performing loop cut");
    runLoopCut(meshId, cutData);
  };

  return (
    <group
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={() => {
        if (hoveredLoop && cutData.length > 0) performLoopCut();
      }}
    >
      {Object.values(mesh.edges).map((e: any) => {
        const v1 = mesh.vertices[e.v1];
        const v2 = mesh.vertices[e.v2];
        if (!v1 || !v2) return null;
        return (
          <line
            key={e.id}
            onPointerMove={(evt) => handlePointerMove(e.id, evt)}
            onPointerOut={handlePointerOut}
            onClick={() => handleClick(e.id)}
          >
            <bufferGeometry attach="geometry">
              <bufferAttribute
                attach="attributes-position"
                itemSize={3}
                args={[new Float32Array([...v1.position, ...v2.position]), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={hoveredEdge === e.id ? "#22c55e" : "#888888"}
              linewidth={2}
            />
            <Line
              key={e.id}
              points={[...v1.position, ...v2.position]}
              color="#fbbf24"
              linewidth={2}
            ></Line>
          </line>
        );
      })}
      {loopCutPoints.length > 1 && (
        <Line
          points={loopCutPoints}
          color="#fbbf24"
          lineWidth={3}
        />
      )}
    </group>
  );
}
