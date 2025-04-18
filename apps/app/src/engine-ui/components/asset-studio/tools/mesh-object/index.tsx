import type { ThreeDObject } from "@/store/three-editor-store";
import type { Mesh } from "three";
import * as THREE from "three";
import { useMemo } from "react";
import type { GeometryParameters } from "@/store/three-editor-store";

export interface MeshObjectProps {
  object: ThreeDObject;
  isSelected: boolean;
  meshRef?: React.Ref<Mesh>;
}

// Custom component to handle editable geometry
function EditableGeometry({ 
  type, 
  parameters,
  vertices
}: { 
  type: string; 
  parameters: GeometryParameters;
  vertices?: [number, number, number][];
}) {
  const geometry = useMemo(() => {
    // Use full attribute arrays if present
    if (parameters.positions && parameters.indices) {
      const bufferGeom = new THREE.BufferGeometry();
      bufferGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(parameters.positions), 3));
      bufferGeom.setIndex(parameters.indices);
      if (parameters.normals) {
        bufferGeom.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(parameters.normals), 3));
      } else {
        bufferGeom.computeVertexNormals();
      }
      if (parameters.uvs) {
        bufferGeom.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(parameters.uvs), 2));
      }
      return bufferGeom;
    }
    // Fallback: use vertices if present
    if (vertices && vertices.length > 0) {
      const bufferGeom = new THREE.BufferGeometry();
      const positions = new Float32Array(vertices.flat());
      bufferGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      // Try to get indices/uvs from a template primitive
      if (type === "box" || type === "sphere" || type === "cylinder" || type === "plane") {
        let tempGeometry: THREE.BufferGeometry;
        switch (type) {
          case "box":
            tempGeometry = new THREE.BoxGeometry(
              parameters?.width ?? 1,
              parameters?.height ?? 1,
              parameters?.depth ?? 1,
              parameters?.widthSegments ?? 1,
              parameters?.heightSegments ?? 1,
              parameters?.depthSegments ?? 1
            );
            break;
          case "sphere":
            tempGeometry = new THREE.SphereGeometry(
              parameters?.radius ?? 0.5,
              parameters?.widthSegments ?? 8,
              parameters?.heightSegments ?? 8
            );
            break;
          case "cylinder":
            tempGeometry = new THREE.CylinderGeometry(
              parameters?.radius ?? 0.5,
              parameters?.radius ?? 0.5,
              parameters?.height ?? 1,
              parameters?.radialSegments ?? 12
            );
            break;
          case "plane":
            tempGeometry = new THREE.PlaneGeometry(
              parameters?.width ?? 1,
              parameters?.height ?? 1,
              parameters?.widthSegments ?? 1,
              parameters?.heightSegments ?? 1
            );
            break;
          default:
            tempGeometry = new THREE.BoxGeometry();
        }
        if (tempGeometry.index) {
          bufferGeom.setIndex(tempGeometry.index);
        }
        if (tempGeometry.getAttribute('uv')) {
          bufferGeom.setAttribute('uv', tempGeometry.getAttribute('uv'));
        }
      }
      bufferGeom.computeVertexNormals();
      return bufferGeom;
    }
    // Fallback: generate from primitive
    let tempGeometry: THREE.BufferGeometry;
    switch (type) {
      case "box":
        tempGeometry = new THREE.BoxGeometry(
          parameters?.width ?? 1,
          parameters?.height ?? 1,
          parameters?.depth ?? 1,
          parameters?.widthSegments ?? 1,
          parameters?.heightSegments ?? 1,
          parameters?.depthSegments ?? 1
        );
        break;
      case "sphere":
        tempGeometry = new THREE.SphereGeometry(
          parameters?.radius ?? 0.5,
          parameters?.widthSegments ?? 8,
          parameters?.heightSegments ?? 8
        );
        break;
      case "cylinder":
        tempGeometry = new THREE.CylinderGeometry(
          parameters?.radius ?? 0.5,
          parameters?.radius ?? 0.5,
          parameters?.height ?? 1,
          parameters?.radialSegments ?? 12
        );
        break;
      case "plane":
        tempGeometry = new THREE.PlaneGeometry(
          parameters?.width ?? 1,
          parameters?.height ?? 1,
          parameters?.widthSegments ?? 1,
          parameters?.heightSegments ?? 1
        );
        break;
      default:
        tempGeometry = new THREE.BoxGeometry();
    }
    const bufferGeom = new THREE.BufferGeometry();
    const posAttr = tempGeometry.getAttribute('position');
    bufferGeom.setAttribute('position', posAttr.clone());
    if (tempGeometry.index) {
      bufferGeom.setIndex(tempGeometry.index.clone());
    }
    if (tempGeometry.getAttribute('normal')) {
      bufferGeom.setAttribute('normal', tempGeometry.getAttribute('normal').clone());
    } else {
      bufferGeom.computeVertexNormals();
    }
    if (tempGeometry.getAttribute('uv')) {
      bufferGeom.setAttribute('uv', tempGeometry.getAttribute('uv').clone());
    }
    return bufferGeom;
  }, [type, parameters, vertices]);

  return <primitive object={geometry} />;
}

export function MeshObject({ object, isSelected, meshRef }: MeshObjectProps) {
  // Create the appropriate geometry and material based on object type
  if (object.type === "mesh") {
    const geomType = object.userData.geometry?.type || "box";
    const vertices = object.userData.geometry?.parameters?.vertices;
    const parameters = object.userData.geometry?.parameters || {};

    return (
      <mesh
        ref={meshRef}
        name={object.id}
        position={
          [object.position.x, object.position.y, object.position.z] as const
        }
        rotation={
          [object.rotation.x, object.rotation.y, object.rotation.z] as const
        }
        scale={[object.scale.x, object.scale.y, object.scale.z] as const}
        visible={object.visible}
        castShadow={object.userData.castShadow}
        receiveShadow={object.userData.receiveShadow}
      >
        <EditableGeometry 
          type={geomType} 
          parameters={parameters}
          vertices={vertices}
        />
        <meshStandardMaterial
          color={object.userData.material?.color ?? "#ffffff"}
          wireframe={object.userData.material?.wireframe ?? false}
          emissive={isSelected ? "#114422" : "#000000"}
          flatShading={object.userData.material?.flatShading ?? false}
          side={
            object.userData.material?.side === "double"
              ? THREE.DoubleSide
              : object.userData.material?.side === "back"
                ? THREE.BackSide
                : THREE.FrontSide
          }
        />
      </mesh>
    );
  } else if (object.type === "light") {
    // Light common props
    const lightProps = {
      name: object.id,
      position: [
        object.position.x,
        object.position.y,
        object.position.z,
      ] as const,
      rotation: [
        object.rotation.x,
        object.rotation.y,
        object.rotation.z,
      ] as const,
      intensity: object.userData.light?.intensity ?? 1,
      color: object.userData.light?.color ?? "#ffffff",
      castShadow: object.userData.light?.castShadow ?? false,
    };

    if (object.name.includes("Directional")) {
      return <directionalLight {...lightProps} />;
    } else {
      return (
        <pointLight
          {...lightProps}
          distance={object.userData.light?.distance ?? 0}
        />
      );
    }
  }

  return null;
}
