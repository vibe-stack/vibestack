import type { PluginBuild, Loader } from "esbuild-wasm";
import { NODE_MODULE_SHIMS } from "./node-shims";
import { preprocessGameFile, resolveRelativePath } from "./utils";

// Extensions to try when resolving imports without extensions
const EXTENSIONS_TO_TRY = [".js", ".mjs", ".jsx", ".json"];

// Log detailed resolution attempts for debugging
const VERBOSE_LOGGING = false;

export const vfsPlugin = (virtualFiles: Record<string, string>) => ({
  name: "virtual-file-system",
  setup(build: PluginBuild) {
    // Debug helper function
    const debugLog = (...args: unknown[]) => {
      if (VERBOSE_LOGGING) {
        console.log("[VFS Plugin]", ...args);
      }
    };

    // Log the files we have in our virtual filesystem
    debugLog("Virtual filesystem initialized with files:", Object.keys(virtualFiles));

    // Handle Node.js built-in modules
    build.onResolve(
      {
        filter: /^(path|fs|process|perf_hooks|events|util|stream|buffer)$/,
      },
      (args) => {
        if (NODE_MODULE_SHIMS[args.path]) {
          return {
            path: args.path,
            namespace: "node-shims",
          };
        }

        // For Node.js modules we don't have shims for, return an empty module
        return {
          path: "empty-module",
          namespace: "node-shims",
        };
      }
    );

    // Resolve external dependencies
    build.onResolve({ filter: /^three$|^nipplejs$|^cannon-es$/ }, (args) => {
      return { external: true, path: args.path };
    });

    // Handle Three.js subpath imports
    build.onResolve({ filter: /^three\/.*/ }, (args) => {
      return { external: true, path: args.path };
    });

    // Attempt to resolve a path in the virtual filesystem with various attempts
    const resolveInVirtualFs = (originalPath: string, importer: string): { resolved: string, found: boolean } | null => {
      const attemptedPaths: string[] = [];
      const importerDir = importer.split("/").slice(0, -1).join("/");
      debugLog(`Resolving ${originalPath} from ${importer} (dir: ${importerDir})`);

      console.log("virtualFiles", virtualFiles);
      
      // Normalize the starting path
      let resolvedPath = originalPath;
      console.log("originalPath", originalPath);
      if (originalPath.startsWith("./") || originalPath.startsWith("../")) {
        resolvedPath = resolveRelativePath(originalPath, importer);
      } else if (!originalPath.startsWith("/")) {
        // Bare import that might be a local file
        resolvedPath = "./" + originalPath;
      }
      
      // Always normalize to lowercase for case-insensitive comparison
      resolvedPath = resolvedPath.toLowerCase();
      
      // Try exact match first
      attemptedPaths.push(resolvedPath);
      console.log("looking for exact match", resolvedPath);
      if (virtualFiles[resolvedPath]) {
        debugLog(`Found exact match: ${resolvedPath}`);
        return { resolved: resolvedPath, found: true };
      }
      console.log("no exact match");

      // Try with extensions
      for (const ext of EXTENSIONS_TO_TRY) {
        if (!resolvedPath.endsWith(ext)) {
          const withExt = resolvedPath + ext;
          attemptedPaths.push(withExt);
          if (virtualFiles[withExt]) {
            debugLog(`Found with extension ${ext}: ${withExt}`);
            return { resolved: withExt, found: true };
          }
        }
      }
      
      // Try as directory with index files
      for (const ext of EXTENSIONS_TO_TRY) {
        const indexPath = `${resolvedPath}/index${ext}`;
        attemptedPaths.push(indexPath);
        if (virtualFiles[indexPath]) {
          debugLog(`Found as directory with index${ext}: ${indexPath}`);
          return { resolved: indexPath, found: true };
        }
      }
      
      // Not found after all attempts
      debugLog(`Not found after trying: ${attemptedPaths.join(", ")}`);
      return { resolved: resolvedPath, found: false };
    };

    // Handle all file resolutions in our virtual file system
    build.onResolve({ filter: /.*/ }, (args) => {
      // Skip if already in a namespace
      if (args.namespace !== "file") {
        return undefined;
      }

      // For relative imports or bare imports that might be local files
      if (args.path.startsWith("./") || args.path.startsWith("../") || !args.path.includes("/")) {
        const result = resolveInVirtualFs(
          args.path,
          args.importer === "<stdin>" ? "." : args.importer
        );
        
        if (result && result.found) {
          return {
            path: result.resolved,
            namespace: "virtual-fs"
          };
        }
        
        // Not found - create detailed error message
        const errorAttempts = EXTENSIONS_TO_TRY.map(ext => 
          `${result?.resolved}${ext}, ${result?.resolved}/index${ext}`
        ).join(", ");
        
        const errorMsg = `Cannot resolve import: ${args.path} from ${args.importer}. Tried: ${result?.resolved}, ${errorAttempts}`;
        console.error(errorMsg);
        
        return {
          path: args.path,
          namespace: "virtual-fs",
          errors: [{ text: errorMsg }],
        };
      }

      // Not a relative import or bare import, let esbuild handle it
      return undefined;
    });

    // Handle imports from within virtual files
    build.onResolve({ filter: /.*/, namespace: "virtual-fs" }, (args) => {
      // For any import from a virtual file
      if (args.path.startsWith("./") || args.path.startsWith("../") || !args.path.includes("/")) {
        const result = resolveInVirtualFs(args.path, args.importer);
        
        if (result && result.found) {
          return {
            path: result.resolved,
            namespace: "virtual-fs"
          };
        }
        
        // Not found - create detailed error message
        const errorAttempts = EXTENSIONS_TO_TRY.map(ext => 
          `${result?.resolved}${ext}, ${result?.resolved}/index${ext}`
        ).join(", ");
        
        const errorMsg = `Cannot resolve import: ${args.path} from ${args.importer}. Tried: ${result?.resolved}, ${errorAttempts}`;
        console.error(errorMsg);
        
        return {
          path: args.path,
          namespace: "virtual-fs",
          errors: [{ text: errorMsg }],
        };
      }
      
      return undefined;
    });

    // Handle our virtual file system loads
    build.onLoad({ filter: /.*/, namespace: "virtual-fs" }, (args) => {
      const content = virtualFiles[args.path.toLowerCase()];

      if (content) {
        // Preprocess imported files
        const processedContent = preprocessGameFile(content);
        
        // Determine the correct loader based on file extension
        let loader: Loader = "text";
        if (args.path.endsWith(".js") || args.path.endsWith(".mjs")) {
          loader = "js";
        } else if (args.path.endsWith(".jsx")) {
          loader = "jsx";
        } else if (args.path.endsWith(".json")) {
          loader = "json";
        }
        
        return {
          contents: processedContent,
          loader,
          resolveDir: args.path.includes("/") 
            ? args.path.substring(0, args.path.lastIndexOf("/")) 
            : "."
        };
      }

      return {
        errors: [
          {
            text: `File not found in virtual filesystem: ${args.path}`,
          },
        ],
      };
    });

    // Node module shims loader
    build.onLoad({ filter: /.*/, namespace: "node-shims" }, (args) => {
      if (args.path === "empty-module") {
        return {
          contents: "export default {}; export const __esModule = true;",
          loader: "js",
        };
      }

      return {
        contents: NODE_MODULE_SHIMS[args.path] || "export default {};",
        loader: "js",
      };
    });
  },
});

