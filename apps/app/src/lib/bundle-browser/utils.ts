import { toast } from "sonner";
import type { GameFile } from "@/store/game-editor-store";

// Cache for external dependencies
const dependencyCache = new Map<string, string>();

/**
 * Create a virtual file system from game files
 */
export function createFileSystem(files: GameFile[]) {
  const virtualFiles: Record<string, string> = {};

  files.forEach((file) => {
    // Store files with normalized paths
    const normalizedPath = file.path.startsWith("./")
      ? file.path
      : "./" + file.path;
    virtualFiles[normalizedPath] = file.content;
  });

  return virtualFiles;
}

/**
 * Resolve a relative import path against a base path
 */
export function resolveRelativePath(
  importPath: string,
  importer: string
): string {
  const importerDir = importer.split("/").slice(0, -1);
  const pathSegments = importPath.split("/");
  const resultSegments = [...importerDir];

  for (const segment of pathSegments) {
    if (segment === "..") {
      if (resultSegments.length > 0) {
        resultSegments.pop();
      }
    } else if (segment !== "." && segment !== "") {
      resultSegments.push(segment);
    }
  }

  return resultSegments.join("/");
}

/**
 * Prefetch a dependency and cache it
 */
export async function fetchDependency(url: string): Promise<string> {
  if (dependencyCache.has(url)) {
    return dependencyCache.get(url)!;
  }

  try {
    console.log(`Prefetching dependency: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to load ${url}: ${response.status} ${response.statusText}`
      );
    }

    const content = await response.text();
    dependencyCache.set(url, content);
    return content;
  } catch (error) {
    console.error(`Error fetching dependency ${url}:`, error);
    throw error;
  }
}

/**
 * Find the main entry point file from game files
 */

export function findEntryPoint(
  files: GameFile[],
  customEntryPoint?: string
): GameFile | undefined {
  // If there's only one JS file, use it as the entry point
  if (files.length === 1 && files[0].path.endsWith(".js")) {
    return files[0];
  }

  if (customEntryPoint) {
    const entry = files.find((file) => file.path.endsWith(customEntryPoint));
    if (entry) {
      return entry;
    }
  }

  // Look for common entry file names
  for (const name of ["main.js", "index.js", "app.js", "game.js"]) {
    const entry = files.find(
      (file) => file.path.endsWith("/" + name) || file.path === name
    );
    if (entry) {
      return entry;
    }
  }

  // Fallback to any JS file
  const jsFile = files.find((file) => file.path.endsWith(".js"));
  if (jsFile) {
    return jsFile;
  }

  toast.error("Yea, your AI screwed up, Game isn't working");
  return undefined;
}

/**
 * Pre-process game file content to fix common issues
 */
export function preprocessGameFile(content: string): string {
  // Replace ES module imports with globals for common libraries
  // return content;
  return (
    content
      .replace(
        /import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]/g,
        "// THREE is already defined globally"
      )
      .replace(
        /import\s+THREE\s+from\s+['"]three['"]/g,
        "// THREE is already defined globally"
      )
      .replace(
        /import\s+nipplejs\s+from\s+['"]nipplejs['"]/g,
        "// nipplejs is already defined globally"
      )
      .replace(
        /import\s+\*\s+as\s+CANNON\s+from\s+['"]cannon-es['"]/g,
        "// CANNON is already defined globally"
      )
      .replace(
        /import\s+CANNON\s+from\s+['"]cannon-es['"]/g,
        "// CANNON is already defined globally"
      )
      // Handle common THREE.js submodule imports with .js extension
      .replace(
        /import\s+\{\s*OrbitControls\s*\}\s+from\s+['"]three\/examples\/jsm\/controls\/OrbitControls\.js['"]/g,
        "// OrbitControls is available as THREE.OrbitControls"
      )
      .replace(
        /import\s+\{\s*GLTFLoader\s*\}\s+from\s+['"]three\/examples\/jsm\/loaders\/GLTFLoader\.js['"]/g,
        "// GLTFLoader is available as THREE.GLTFLoader"
      )
      .replace(
        /import\s+\{\s*FBXLoader\s*\}\s+from\s+['"]three\/examples\/jsm\/loaders\/FBXLoader\.js['"]/g,
        "// FBXLoader is available as THREE.FBXLoader"
      )
      .replace(
        /import\s+\{\s*OBJLoader\s*\}\s+from\s+['"]three\/examples\/jsm\/loaders\/OBJLoader\.js['"]/g,
        "// OBJLoader is available as THREE.OBJLoader"
      )
      .replace(
        /import\s+\{\s*MTLLoader\s*\}\s+from\s+['"]three\/examples\/jsm\/loaders\/MTLLoader\.js['"]/g,
        "// MTLLoader is available as THREE.MTLLoader"
      )
      .replace(
        /import\s+\{\s*SVGLoader\s*\}\s+from\s+['"]three\/examples\/jsm\/loaders\/SVGLoader\.js['"]/g,
        "// SVGLoader is available as THREE.SVGLoader"
      )
      .replace(
        /import\s+\{\s*FontLoader\s*\}\s+from\s+['"]three\/examples\/jsm\/loaders\/FontLoader\.js['"]/g,
        "// FontLoader is available as THREE.FontLoader"
      )
      .replace(
        /import\s+\{\s*TextGeometry\s*\}\s+from\s+['"]three\/examples\/jsm\/geometries\/TextGeometry\.js['"]/g,
        "// TextGeometry is available as THREE.TextGeometry"
      )
      .replace(
        /import\s+\{\s*EffectComposer\s*\}\s+from\s+['"]three\/examples\/jsm\/postprocessing\/EffectComposer\.js['"]/g,
        "// EffectComposer is available as THREE.EffectComposer"
      )
      .replace(
        /import\s+\{\s*RenderPass\s*\}\s+from\s+['"]three\/examples\/jsm\/postprocessing\/RenderPass\.js['"]/g,
        "// RenderPass is available as THREE.RenderPass"
      )
      .replace(
        /import\s+\{\s*UnrealBloomPass\s*\}\s+from\s+['"]three\/examples\/jsm\/postprocessing\/UnrealBloomPass\.js['"]/g,
        "// UnrealBloomPass is available as THREE.UnrealBloomPass"
      )
      // Handle common THREE.js submodule imports without .js extension
      .replace(
        /import\s+\{\s*OrbitControls\s*\}\s+from\s+['"]three\/examples\/jsm\/controls\/OrbitControls['"]/g,
        "// OrbitControls is available as THREE.OrbitControls"
      )
      .replace(
        /import\s+\{\s*GLTFLoader\s*\}\s+from\s+['"]three\/examples\/jsm\/loaders\/GLTFLoader['"]/g,
        "// GLTFLoader is available as THREE.GLTFLoader"
      )
      .replace(
        /import\s+\{\s*FBXLoader\s*\}\s+from\s+['"]three\/examples\/jsm\/loaders\/FBXLoader['"]/g,
        "// FBXLoader is available as THREE.FBXLoader"
      )
      .replace(
        /import\s+\{\s*OBJLoader\s*\}\s+from\s+['"]three\/examples\/jsm\/loaders\/OBJLoader['"]/g,
        "// OBJLoader is available as THREE.OBJLoader"
      )
      .replace(
        /import\s+\{\s*MTLLoader\s*\}\s+from\s+['"]three\/examples\/jsm\/loaders\/MTLLoader['"]/g,
        "// MTLLoader is available as THREE.MTLLoader"
      )
      .replace(
        /import\s+\{\s*SVGLoader\s*\}\s+from\s+['"]three\/examples\/jsm\/loaders\/SVGLoader['"]/g,
        "// SVGLoader is available as THREE.SVGLoader"
      )
      .replace(
        /import\s+\{\s*FontLoader\s*\}\s+from\s+['"]three\/examples\/jsm\/loaders\/FontLoader['"]/g,
        "// FontLoader is available as THREE.FontLoader"
      )
      .replace(
        /import\s+\{\s*TextGeometry\s*\}\s+from\s+['"]three\/examples\/jsm\/geometries\/TextGeometry['"]/g,
        "// TextGeometry is available as THREE.TextGeometry"
      )
      .replace(
        /import\s+\{\s*EffectComposer\s*\}\s+from\s+['"]three\/examples\/jsm\/postprocessing\/EffectComposer['"]/g,
        "// EffectComposer is available as THREE.EffectComposer"
      )
      .replace(
        /import\s+\{\s*RenderPass\s*\}\s+from\s+['"]three\/examples\/jsm\/postprocessing\/RenderPass['"]/g,
        "// RenderPass is available as THREE.RenderPass"
      )
      .replace(
        /import\s+\{\s*UnrealBloomPass\s*\}\s+from\s+['"]three\/examples\/jsm\/postprocessing\/UnrealBloomPass['"]/g,
        "// UnrealBloomPass is available as THREE.UnrealBloomPass"
      )
      // Generic pattern for any other THREE submodule imports
      .replace(
        /import\s+\{([^}]+)\}\s+from\s+['"]three\/examples\/jsm\/([^'"]+)['"]/g,
        (match, imports) => {
          const modules = imports.split(",").map((imp: string) => imp.trim());
          return "// " + modules.join(", ") + " imported from THREE submodules";
        }
      )
  );
}
