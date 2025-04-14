import * as esbuild from "esbuild-wasm";
import { GameFile } from "@/store/game-editor-store";
import { toast } from "sonner";
import { createFileSystem, findEntryPoint, preprocessGameFile } from "./utils";
import { fetchDependency } from "./utils";
import { vfsPlugin } from "./vfs-plugin";

// Use a global singleton promise for initialization
let esbuildInitPromise: Promise<void> | null = null;
let isEsbuildInitialized = false;

/**
 * Initialize esbuild WASM binary using singleton pattern
 */
export async function initEsbuild() {
  if (!esbuildInitPromise) {
    esbuildInitPromise = esbuild
      .initialize({
        worker: true,
        wasmURL: "https://unpkg.com/esbuild-wasm@0.25.2/esbuild.wasm",
      })
      .then(() => {
        isEsbuildInitialized = true;
      })
      .catch((err) => {
        toast.error("Preview is not available in your browser.");
        esbuildInitPromise = null;
        isEsbuildInitialized = false;
        throw err;
      });
  }

  return esbuildInitPromise;
}

/**
 * Stop esbuild WASM instance to free up memory
 */
export function stopEsbuild() {
  if (isEsbuildInitialized) {
    try {
      esbuild
        .stop()
        .catch(() => {
          toast.error("Something went wrong.");
        })
        .finally(() => {
          isEsbuildInitialized = false;
          esbuildInitPromise = null;
        });
    } catch (e) {
      toast.error("Something went wrong." + (e as Error).message);
    }
  }
}

/**
 * Bundle game files using esbuild
 */
export async function bundleGameFiles(
  files: GameFile[],
  entryPoint?: string
): Promise<string> {
  try {
    console.log("Bundling game files", files, entryPoint);
    await initEsbuild();

    // Prefetch common dependencies
    await Promise.all([
      fetchDependency("https://unpkg.com/three@0.175.0/build/three.module.js"),
      fetchDependency("https://unpkg.com/nipplejs@0.10.1/dist/nipplejs.js"),
      fetchDependency(
        "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js"
      ),
    ]);

    const virtualFiles = createFileSystem(files);

    // Find the main entry file
    const mainFile = findEntryPoint(files, entryPoint);

    if (!mainFile) {
      throw new Error("No JavaScript entry point found in game files");
    }

    console.log("Using entry point:", mainFile.path);

    // Preprocess the entry file content to handle imports
    const processedContent = preprocessGameFile(mainFile.content);

    // Bundle directly from the content string instead of trying to use a file path
    const result = await esbuild.build({
      stdin: {
        contents: processedContent,
        loader: "js",
        resolveDir: "/",
        sourcefile: mainFile.path,
      },
      bundle: true,
      write: false,
      format: "iife",
      target: "es2020",
      minify: true,
      sourcemap: "inline",
      external: [
        "three",
        "nipplejs",
        "cannon-es",
        "three/examples/jsm/controls/OrbitControls.js",
        "three/examples/jsm/loaders/GLTFLoader.js",
        "three/examples/jsm/loaders/FBXLoader.js",
        "three/examples/jsm/loaders/OBJLoader.js",
        "three/examples/jsm/loaders/MTLLoader.js",
        "three/examples/jsm/loaders/SVGLoader.js",
        "three/examples/jsm/loaders/FontLoader.js",
        "three/examples/jsm/geometries/TextGeometry.js",
        "three/examples/jsm/postprocessing/EffectComposer.js",
        "three/examples/jsm/postprocessing/RenderPass.js",
        "three/examples/jsm/postprocessing/UnrealBloomPass.js",
      ],
      logLevel: "warning",
      plugins: [vfsPlugin(virtualFiles)],
    });

    return result.outputFiles![0].text;
  } catch (error) {
    console.error("Bundle error:", error);
    throw error;
  }
}
