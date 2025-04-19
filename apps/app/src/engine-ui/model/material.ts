export type MaterialType = 'standard' | 'basic' | 'phong' | 'physical' | 'lambert' | 'toon';

export type Material = {
  id: string;
  name: string;
  type: MaterialType;
  color: string;
  wireframe?: boolean;
  
  // Standard material properties
  roughness?: number;
  metalness?: number;
  
  // Phong material properties
  shininess?: number;
  specular?: string;
  
  // Physical material properties
  clearcoat?: number;
  clearcoatRoughness?: number;
  
  // Common properties
  opacity?: number;
  transparent?: boolean;
};

export type MaterialsMap = Record<string, Material>; 