 // Node.js module shims for browser compatibility
export const NODE_MODULE_SHIMS: Record<string, string> = {
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