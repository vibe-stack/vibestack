import { useThree } from "@react-three/fiber";
import { useState } from "react";
import * as THREE from "three";
import { findMeshLoops } from "./find-mesh-loops";
import { Line } from "@react-three/drei";

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

    // Convert mouse to normalized device coordinates
    const mouse = new THREE.Vector2(
      (e.clientX / gl.domElement.clientWidth) * 2 - 1,
      -(e.clientY / gl.domElement.clientHeight) * 2 + 1
    );

    // Create ray from camera
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Transform vertices to world space
    const worldV1 = new THREE.Vector3()
      .fromArray(v1.position)
      .applyMatrix4(group.matrixWorld);
    const worldV2 = new THREE.Vector3()
      .fromArray(v2.position)
      .applyMatrix4(group.matrixWorld);

    // Find closest point on edge to ray
    const edgeDir = new THREE.Vector3().subVectors(worldV2, worldV1);
    const edgeLength = edgeDir.length();
    edgeDir.normalize();

    const rayOrigin = raycaster.ray.origin;
    const rayDir = raycaster.ray.direction;

    // Line-line closest point calculation
    const v1ToRayOrigin = new THREE.Vector3().subVectors(rayOrigin, worldV1);
    const d1 = v1ToRayOrigin.dot(edgeDir);
    const d2 = v1ToRayOrigin.dot(rayDir);
    const d3 = edgeDir.dot(rayDir);

    const denom = 1 - d3 * d3;
    if (Math.abs(denom) < 0.0001) return; // Parallel lines, skip

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
  if (hoveredLoop && hoveredEdge) {
    // Traverse the loop in order, collecting the center of the perpendicular edge opposite each edge in the loop
    for (const edgeId of hoveredLoop) {
      const edge = mesh.edges[edgeId];
      if (!edge) continue;
      // Find a quad face containing this edge
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
    }
    // Close the loop if needed
    if (loopCutPoints.length > 2) {
      loopCutPoints.push(loopCutPoints[0]);
    }
  }

  return (
    <group position={position} rotation={rotation} scale={scale}>
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
        <Line points={loopCutPoints} color="#fbbf24" lineWidth={3} />
      )}
    </group>
  );
}
