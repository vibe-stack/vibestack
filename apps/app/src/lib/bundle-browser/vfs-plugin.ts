import type { PluginBuild } from "esbuild-wasm";
import { NODE_MODULE_SHIMS } from "./node-shims";
import { preprocessGameFile, resolveRelativePath } from "./utils";

export const vfsPlugin = (virtualFiles: Record<string, string>) => ({
  name: "virtual-file-system",
  setup(build: PluginBuild) {
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

    // Handle all file resolutions in our virtual file system
    build.onResolve({ filter: /.*/ }, (args) => {
      // Skip if already in a namespace
      if (args.namespace !== "file") {
        return undefined;
      }

      // Handle relative imports
      if (args.path.startsWith("./") || args.path.startsWith("../")) {
        // Resolve relative to importer
        const resolvedPath =
          args.importer === "<stdin>"
            ? args.path
            : resolveRelativePath(args.path, args.importer);

        // Look for file in our virtual system
        if (virtualFiles[resolvedPath]) {
          return {
            path: resolvedPath,
            namespace: "virtual-fs",
          };
        }

        // Try adding .js extension
        if (!resolvedPath.endsWith(".js")) {
          const withJsExt = resolvedPath + ".js";
          if (virtualFiles[withJsExt]) {
            return {
              path: withJsExt,
              namespace: "virtual-fs",
            };
          }
        }

        console.error(
          `Cannot resolve import: ${args.path} from ${args.importer}`
        );
        return {
          path: args.path,
          namespace: "virtual-fs",
          errors: [
            {
              text: `Cannot resolve import: ${args.path} from ${args.importer}`,
            },
          ],
        };
      }

      // Bare imports that aren't external dependencies - try to find in virtual filesystem
      // Look for file with exact path
      if (virtualFiles["./" + args.path]) {
        return {
          path: "./" + args.path,
          namespace: "virtual-fs",
        };
      }

      // Look for file with .js extension
      if (
        !args.path.endsWith(".js") &&
        virtualFiles["./" + args.path + ".js"]
      ) {
        return {
          path: "./" + args.path + ".js",
          namespace: "virtual-fs",
        };
      }

      // Not found, but it might be an external module so let esbuild handle it
      return undefined;
    });

    // Handle our virtual file system loads
    build.onLoad({ filter: /.*/, namespace: "virtual-fs" }, (args) => {
      const content = virtualFiles[args.path];

      if (content) {
        // Also preprocess imported files
        const processedContent = preprocessGameFile(content);
        return {
          contents: processedContent,
          loader: args.path.endsWith(".js") ? "js" : "text",
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
