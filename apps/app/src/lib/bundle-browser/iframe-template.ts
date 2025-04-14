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
     threeModules: false,
     nipplejs: false,
     cannon: false
   };
   
   // Function to check if all libraries are loaded
   window.checkLibrariesLoaded = function() {
     if (window.librariesLoaded.three && 
         window.librariesLoaded.threeModules &&
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
 
 <!-- Load THREE.js modules -->
 <script type="module">
   // Import common THREE.js modules
   import { OrbitControls } from 'https://unpkg.com/three@0.175.0/examples/jsm/controls/OrbitControls.js';
   import { GLTFLoader } from 'https://unpkg.com/three@0.175.0/examples/jsm/loaders/GLTFLoader.js';
   import { FBXLoader } from 'https://unpkg.com/three@0.175.0/examples/jsm/loaders/FBXLoader.js';
   import { OBJLoader } from 'https://unpkg.com/three@0.175.0/examples/jsm/loaders/OBJLoader.js';
   import { MTLLoader } from 'https://unpkg.com/three@0.175.0/examples/jsm/loaders/MTLLoader.js';
   import { SVGLoader } from 'https://unpkg.com/three@0.175.0/examples/jsm/loaders/SVGLoader.js';
   import { FontLoader } from 'https://unpkg.com/three@0.175.0/examples/jsm/loaders/FontLoader.js';
   import { TextGeometry } from 'https://unpkg.com/three@0.175.0/examples/jsm/geometries/TextGeometry.js';
   import { EffectComposer } from 'https://unpkg.com/three@0.175.0/examples/jsm/postprocessing/EffectComposer.js';
   import { RenderPass } from 'https://unpkg.com/three@0.175.0/examples/jsm/postprocessing/RenderPass.js';
   import { UnrealBloomPass } from 'https://unpkg.com/three@0.175.0/examples/jsm/postprocessing/UnrealBloomPass.js';
   
   console.log('THREE modules loaded');
   window.librariesLoaded.threeModules = true;
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

 <script type="importmap">
 {
   "imports": {
     "three": "https://unpkg.com/three@0.175.0/build/three.module.js",
     "cannon-es": "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js",
     "nipplejs": "https://unpkg.com/nipplejs@0.10.1/dist/nipplejs.js",
     "three/examples/jsm/controls/OrbitControls": "https://unpkg.com/three@0.175.0/examples/jsm/controls/OrbitControls.js",
     "three/examples/jsm/loaders/GLTFLoader": "https://unpkg.com/three@0.175.0/examples/jsm/loaders/GLTFLoader.js",
     "three/examples/jsm/loaders/FBXLoader": "https://unpkg.com/three@0.175.0/examples/jsm/loaders/FBXLoader.js",
     "three/examples/jsm/loaders/OBJLoader": "https://unpkg.com/three@0.175.0/examples/jsm/loaders/OBJLoader.js",
     "three/examples/jsm/loaders/MTLLoader": "https://unpkg.com/three@0.175.0/examples/jsm/loaders/MTLLoader.js",
     "three/examples/jsm/loaders/SVGLoader": "https://unpkg.com/three@0.175.0/examples/jsm/loaders/SVGLoader.js",
     "three/examples/jsm/loaders/FontLoader": "https://unpkg.com/three@0.175.0/examples/jsm/loaders/FontLoader.js",
     "three/examples/jsm/geometries/TextGeometry": "https://unpkg.com/three@0.175.0/examples/jsm/geometries/TextGeometry.js",
     "three/examples/jsm/postprocessing/EffectComposer": "https://unpkg.com/three@0.175.0/examples/jsm/postprocessing/EffectComposer.js",
     "three/examples/jsm/postprocessing/RenderPass": "https://unpkg.com/three@0.175.0/examples/jsm/postprocessing/RenderPass.js",
     "three/examples/jsm/postprocessing/UnrealBloomPass": "https://unpkg.com/three@0.175.0/examples/jsm/postprocessing/UnrealBloomPass.js"
   }
 }
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
     console.log('THREE.OrbitControls =', !!window.THREE.OrbitControls);
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
