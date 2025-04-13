import * as esbuild from 'esbuild-wasm';
import { GameFile } from '@/store/game-editor-store';

// Use a global singleton promise for initialization
let esbuildInitPromise: Promise<void> | null = null;
let isEsbuildInitialized = false;

// Cache for external dependencies
const dependencyCache = new Map<string, string>();

// Node.js module shims for browser compatibility
const NODE_MODULE_SHIMS: Record<string, string> = {
  perf_hooks: `
    export const performance = window.performance;
    export default { performance };
  `,
  process: `
    export default { env: {}, browser: true };
  `,
  path: `
    export function join(...parts) { return parts.join('/').replace(/\\/+/g, '/'); }
    export function resolve(...parts) { return parts.join('/').replace(/\\/+/g, '/'); }
    export function dirname(path) { return path.split('/').slice(0, -1).join('/'); }
    export function basename(path, ext) { 
      const base = path.split('/').pop() || ''; 
      return ext && base.endsWith(ext) ? base.slice(0, -ext.length) : base;
    }
    export function extname(path) {
      const base = path.split('/').pop() || '';
      const idx = base.lastIndexOf('.');
      return idx !== -1 ? base.slice(idx) : '';
    }
    export default { join, resolve, dirname, basename, extname };
  `,
  fs: `
    export default { 
      readFileSync: () => { throw new Error('fs.readFileSync is not supported in the browser'); },
      writeFileSync: () => { throw new Error('fs.writeFileSync is not supported in the browser'); },
      existsSync: () => false
    };
  `,
};

/**
 * Initialize esbuild WASM binary using singleton pattern
 */
export async function initEsbuild() {
  if (!esbuildInitPromise) {
    console.log("Initializing esbuild WASM");
    
    esbuildInitPromise = esbuild
      .initialize({
        worker: true,
        wasmURL: 'https://unpkg.com/esbuild-wasm@0.25.2/esbuild.wasm',
      })
      .then(() => {
        console.log("esbuild WASM initialized successfully");
        isEsbuildInitialized = true;
      })
      .catch((err) => {
        console.error("esbuild initialization failed:", err);
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
        .then(() => {
          console.log("esbuild WASM stopped successfully");
        })
        .catch((err) => {
          console.error("Failed to stop esbuild:", err);
        })
        .finally(() => {
          isEsbuildInitialized = false;
          esbuildInitPromise = null;
        });
    } catch (err) {
      console.error("Failed to stop esbuild:", err);
    }
  }
}

/**
 * Create a virtual file system from game files
 */
function createFileSystem(files: GameFile[]) {
  const virtualFiles: Record<string, string> = {};
  
  files.forEach(file => {
    // Store files with normalized paths
    const normalizedPath = file.path.startsWith('./') ? file.path : './' + file.path;
    virtualFiles[normalizedPath] = file.content;
  });
  
  return virtualFiles;
}

/**
 * Resolve a relative import path against a base path
 */
function resolveRelativePath(importPath: string, importer: string): string {
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
 * Get CDN URL for a specific package
 */
function getPackageUrl(packageName: string, version: string): string {
  if (packageName === "three") {
    return `https://unpkg.com/three@0.175.0/build/three.module.js`;
  } else if (packageName === "nipplejs") {
    return `https://unpkg.com/nipplejs@0.10.1/dist/nipplejs.js`;
  } else if (packageName === "cannon-es") {
    return `https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js`;
  }
  
  return `https://unpkg.com/${packageName}@${version}`;
}

/**
 * Prefetch a dependency and cache it
 */
async function fetchDependency(url: string): Promise<string> {
  if (dependencyCache.has(url)) {
    return dependencyCache.get(url)!;
  }

  try {
    console.log(`Prefetching dependency: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
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
function findEntryPoint(files: GameFile[], customEntryPoint?: string): GameFile | undefined {
  console.log("Finding entry point among", files.length, "files");
  files.forEach(file => {
    console.log("File:", file.path);
  });
  
  // If there's only one JS file, use it as the entry point
  if (files.length === 1 && files[0].path.endsWith('.js')) {
    console.log("Using single file as entry point:", files[0].path);
    return files[0];
  }
  
  if (customEntryPoint) {
    const entry = files.find(file => file.path.endsWith(customEntryPoint));
    if (entry) {
      console.log("Found custom entry point:", entry.path);
      return entry;
    }
  }
  
  // Look for common entry file names
  for (const name of ['main.js', 'index.js', 'app.js', 'game.js']) {
    const entry = files.find(file => file.path.endsWith('/' + name) || file.path === name);
    if (entry) {
      console.log("Found entry point by name:", entry.path);
      return entry;
    }
  }
  
  // Fallback to any JS file
  const jsFile = files.find(file => file.path.endsWith('.js'));
  if (jsFile) {
    console.log("Using fallback JS file as entry point:", jsFile.path);
    return jsFile;
  }
  
  console.log("No suitable entry point found");
  return undefined;
}

/**
 * Pre-process game file content to fix common issues
 */
function preprocessGameFile(content: string): string {
  // Replace ES module imports with globals for common libraries
  return content
    .replace(/import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]/g, '// THREE is already defined globally')
    .replace(/import\s+THREE\s+from\s+['"]three['"]/g, '// THREE is already defined globally')
    .replace(/import\s+nipplejs\s+from\s+['"]nipplejs['"]/g, '// nipplejs is already defined globally')
    .replace(/import\s+\*\s+as\s+CANNON\s+from\s+['"]cannon-es['"]/g, '// CANNON is already defined globally')
    .replace(/import\s+CANNON\s+from\s+['"]cannon-es['"]/g, '// CANNON is already defined globally');
}

/**
 * Bundle game files using esbuild
 */
export async function bundleGameFiles(files: GameFile[], entryPoint?: string): Promise<string> {
  try {
    console.log("Bundling game files", files, entryPoint);
    await initEsbuild();
    
    // Prefetch common dependencies
    await Promise.all([
      fetchDependency('https://unpkg.com/three@0.175.0/build/three.module.js'),
      fetchDependency('https://unpkg.com/nipplejs@0.10.1/dist/nipplejs.js'),
      fetchDependency('https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js'),
    ]);
    
    const virtualFiles = createFileSystem(files);
    console.log("Virtual files created:", Object.keys(virtualFiles));
    
    // Find the main entry file
    const mainFile = findEntryPoint(files, entryPoint);
    
    if (!mainFile) {
      throw new Error('No JavaScript entry point found in game files');
    }
    
    console.log("Using entry point:", mainFile.path);
    
    // Preprocess the entry file content to handle imports
    const processedContent = preprocessGameFile(mainFile.content);
    
    // Bundle directly from the content string instead of trying to use a file path
    const result = await esbuild.build({
      stdin: {
        contents: processedContent,
        loader: 'js',
        resolveDir: '/',
        sourcefile: mainFile.path,
      },
      bundle: true,
      write: false,
      format: 'iife',
      target: 'es2020',
      minify: true,
      sourcemap: 'inline',
      external: ['three', 'nipplejs', 'cannon-es'],
      logLevel: 'warning',
      plugins: [
        {
          name: 'virtual-file-system',
          setup(build) {
            // Handle Node.js built-in modules
            build.onResolve(
              { filter: /^(path|fs|process|perf_hooks|events|util|stream|buffer)$/ },
              (args) => {
                if (NODE_MODULE_SHIMS[args.path]) {
                  return {
                    path: args.path,
                    namespace: 'node-shims',
                  };
                }

                // For Node.js modules we don't have shims for, return an empty module
                return {
                  path: 'empty-module',
                  namespace: 'node-shims',
                };
              }
            );
            
            // Resolve external dependencies
            build.onResolve({ filter: /^three$|^nipplejs$|^cannon-es$/ }, args => {
              return { external: true, path: args.path };
            });
            
            // Handle Three.js subpath imports
            build.onResolve({ filter: /^three\/.*/ }, args => {
              return { external: true, path: args.path };
            });
            
            // Handle all file resolutions in our virtual file system
            build.onResolve({ filter: /.*/ }, args => {
              // Skip if already in a namespace
              if (args.namespace !== 'file') {
                return undefined;
              }
              
              // External packages
              if (
                args.path === 'three' || 
                args.path.startsWith('three/') || 
                args.path === 'nipplejs' || 
                args.path === 'cannon-es'
              ) {
                return { external: true, path: args.path };
              }
              
              // Handle relative imports
              if (args.path.startsWith('./') || args.path.startsWith('../')) {
                // Resolve relative to importer
                const resolvedPath = args.importer === '<stdin>' 
                  ? args.path 
                  : resolveRelativePath(args.path, args.importer);
                
                // Look for file in our virtual system
                if (virtualFiles[resolvedPath]) {
                  return { 
                    path: resolvedPath,
                    namespace: 'virtual-fs',
                  };
                }
                
                // Try adding .js extension
                if (!resolvedPath.endsWith('.js')) {
                  const withJsExt = resolvedPath + '.js';
                  if (virtualFiles[withJsExt]) {
                    return { 
                      path: withJsExt,
                      namespace: 'virtual-fs', 
                    };
                  }
                }
                
                console.error(`Cannot resolve import: ${args.path} from ${args.importer}`);
                return {
                  path: args.path,
                  namespace: 'virtual-fs',
                  errors: [{ text: `Cannot resolve import: ${args.path} from ${args.importer}` }]
                };
              }
              
              // Bare imports that aren't external dependencies - try to find in virtual filesystem
              // Look for file with exact path
              if (virtualFiles['./' + args.path]) {
                return { 
                  path: './' + args.path,
                  namespace: 'virtual-fs', 
                };
              }
              
              // Look for file with .js extension
              if (!args.path.endsWith('.js') && virtualFiles['./' + args.path + '.js']) {
                return { 
                  path: './' + args.path + '.js',
                  namespace: 'virtual-fs', 
                };
              }
              
              // Not found, but it might be an external module so let esbuild handle it
              return undefined;
            });
            
            // Handle our virtual file system loads
            build.onLoad({ filter: /.*/, namespace: 'virtual-fs' }, args => {
              const content = virtualFiles[args.path];
              
              if (content) {
                // Also preprocess imported files
                const processedContent = preprocessGameFile(content);
                return {
                  contents: processedContent,
                  loader: args.path.endsWith('.js') ? 'js' : 'text',
                };
              }
              
              return {
                errors: [{ text: `File not found in virtual filesystem: ${args.path}` }]
              };
            });
            
            // Node module shims loader
            build.onLoad({ filter: /.*/, namespace: 'node-shims' }, args => {
              if (args.path === 'empty-module') {
                return {
                  contents: 'export default {}; export const __esModule = true;',
                  loader: 'js',
                };
              }
              
              return {
                contents: NODE_MODULE_SHIMS[args.path] || 'export default {};',
                loader: 'js',
              };
            });
          },
        },
      ],
    });
    
    return result.outputFiles![0].text;
  } catch (error) {
    console.error('Bundle error:', error);
    throw error;
  }
}

/**
 * Create HTML content for the game iframe
 */
export function createGameIframeContent(bundledCode: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Game Preview</title>
  <style>
    body, html { 
      margin: 0; 
      padding: 0; 
      width: 100%; 
      height: 100%; 
      overflow: hidden;
      background: #000;
    }
    canvas { 
      display: block; 
      width: 100%; 
      height: 100%;
    }
    #GGEZ {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    #error-display {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: rgba(255, 0, 0, 0.8);
      color: white;
      font-family: monospace;
      padding: 10px;
      display: none;
      white-space: pre-wrap;
      overflow: auto;
      max-height: 50%;
      z-index: 9999;
    }
  </style>
  
  <!-- Use global define to capture THREE from module -->
  <script>
    // Create global placeholders
    window.THREE = {};
    window.nipplejs = null;
    window.CANNON = {};
    
    // Track library loading
    window.librariesLoaded = {
      three: false,
      nipplejs: false,
      cannon: false
    };
    
    // Function to check if all libraries are loaded
    window.checkLibrariesLoaded = function() {
      if (window.librariesLoaded.three && 
          window.librariesLoaded.nipplejs && 
          window.librariesLoaded.cannon) {
        console.log('All libraries loaded');
        window.dispatchEvent(new Event('allLibrariesLoaded'));
        return true;
      }
      return false;
    };
  </script>
</head>
<body>
  <div id="error-display"></div>
  <div id="GGEZ">
    <canvas id="GGEZ_CANVAS"></canvas>
  </div>
  
  <!-- Load libraries -->
  <script type="module">
    // Import THREE as a module and assign to global
    import * as THREE from 'https://unpkg.com/three@0.175.0/build/three.module.js';
    window.THREE = THREE;
    console.log('THREE loaded as module');
    window.librariesLoaded.three = true;
    window.checkLibrariesLoaded();
  </script>
  
  <script type="module">
    // Import CANNON as a module and assign to global
    import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';
    window.CANNON = CANNON;
    console.log('CANNON loaded as module');
    window.librariesLoaded.cannon = true;
    window.checkLibrariesLoaded();
  </script>
  
  <script>
    // Load nipplejs with a regular script tag (it's UMD)
    fetch('https://unpkg.com/nipplejs@0.10.1/dist/nipplejs.js')
      .then(response => response.text())
      .then(code => {
        // Execute the code
        eval(code);
        // Make sure nipplejs is assigned to window
        window.nipplejs = window.nipplejs || nipplejs;
        console.log('nipplejs loaded');
        window.librariesLoaded.nipplejs = true;
        window.checkLibrariesLoaded();
      })
      .catch(error => {
        console.error('Failed to load nipplejs:', error);
      });
  </script>
  
  <script>
    // Setup error handling
    const errorDisplay = document.getElementById('error-display');
    window.addEventListener('error', function(event) {
      console.error('Game error:', event.message, event);
      errorDisplay.textContent = 'Error: ' + event.message + '\\nAt: ' + event.filename + ':' + event.lineno;
      errorDisplay.style.display = 'block';
      
      // Send error to parent
      window.parent.postMessage({
        type: 'ERROR',
        message: event.message,
        stack: event.error?.stack || ''
      }, '*');
      
      event.preventDefault();
    });
    
    window.addEventListener('message', function(event) {
      if (event.data.type === 'PLAY') {
        // Game control messages can be handled here
      }
    });
    
    // Wait for libraries to load before running game code
    function runGame() {
      console.log('Libraries ready - running game');
      console.log('THREE.Scene =', !!window.THREE.Scene);
      console.log('nipplejs =', !!window.nipplejs);
      console.log('CANNON =', !!window.CANNON);
      
      try {
        // Game code as normal script, not a module
        ${bundledCode}
        
        // Signal successful load to parent
        window.parent.postMessage({ type: 'LOADED' }, '*');
      } catch (err) {
        console.error('Error executing game code:', err);
        errorDisplay.textContent = 'Error: ' + err.message + '\\n' + err.stack;
        errorDisplay.style.display = 'block';
        
        // Send error to parent
        window.parent.postMessage({
          type: 'ERROR',
          message: err.message,
          stack: err.stack || ''
        }, '*');
      }
    }
    
    // Listen for all libraries loaded event
    window.addEventListener('allLibrariesLoaded', function() {
      // Small delay to ensure everything is properly initialized
      setTimeout(runGame, 200);
    });
    
    // Check if libraries are already loaded
    window.checkLibrariesLoaded();
  </script>
</body>
</html>`;
}
