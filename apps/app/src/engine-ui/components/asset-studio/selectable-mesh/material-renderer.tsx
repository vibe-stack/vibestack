import * as THREE from "three";

export function MaterialRenderer({ obj, material }: { obj: any; material: any }) {
  if (!obj) return null;
  if (!material) {
    return (
      <meshStandardMaterial 
        color="#22c55e"
        wireframe={obj.wireframe}
        flatShading={obj.shading === 'flat'}
        side={
          obj.sides === 'front' 
            ? THREE.FrontSide 
            : obj.sides === 'back' 
              ? THREE.BackSide 
              : THREE.DoubleSide
        }
      />
    );
  }
  const commonProps = {
    color: material.color,
    wireframe: material.wireframe || obj.wireframe,
    side: obj.sides === 'front' 
      ? THREE.FrontSide 
      : obj.sides === 'back' 
        ? THREE.BackSide 
        : THREE.DoubleSide,
    transparent: !!material.transparent,
    opacity: material.opacity !== undefined ? material.opacity : 1
  };
  switch (material.type) {
    case 'basic':
      return <meshBasicMaterial {...commonProps} />;
    case 'standard':
      return (
        <meshStandardMaterial 
          {...commonProps} 
          flatShading={obj.shading === 'flat'}
          roughness={material.roughness !== undefined ? material.roughness : 0.5}
          metalness={material.metalness !== undefined ? material.metalness : 0}
        />
      );
    case 'phong':
      return (
        <meshPhongMaterial 
          {...commonProps} 
          flatShading={obj.shading === 'flat'}
          shininess={material.shininess !== undefined ? material.shininess : 30}
          specular={material.specular || '#111111'}
        />
      );
    case 'physical':
      return (
        <meshPhysicalMaterial 
          {...commonProps} 
          flatShading={obj.shading === 'flat'}
          roughness={material.roughness !== undefined ? material.roughness : 0.5}
          metalness={material.metalness !== undefined ? material.metalness : 0}
          clearcoat={material.clearcoat !== undefined ? material.clearcoat : 0}
          clearcoatRoughness={material.clearcoatRoughness !== undefined ? material.clearcoatRoughness : 0}
        />
      );
    case 'lambert':
      return (
        <meshLambertMaterial 
          {...commonProps} 
          flatShading={obj.shading === 'flat'}
        />
      );
    case 'toon':
      return (
        <meshToonMaterial 
          {...commonProps} 
        />
      );
    default:
      return <meshStandardMaterial {...commonProps} flatShading={obj.shading === 'flat'} />;
  }
} 