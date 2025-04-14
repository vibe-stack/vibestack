// Node.js module shims for browser compatibility
export const NODE_MODULE_SHIMS: Record<string, string> = {
  perf_hooks: `
    export const performance = window.performance;
    export const PerformanceObserver = class PerformanceObserver {
      constructor(callback) { this.callback = callback; }
      observe() {}
      disconnect() {}
    };
    export default { performance, PerformanceObserver };
  `,
  process: `
    const processShim = { 
      env: {},
      browser: true,
      version: '',
      platform: 'browser',
      cwd: () => '/',
      nextTick: (fn, ...args) => setTimeout(() => fn(...args), 0)
    };
    export default processShim;
  `,
  path: `
    export function join(...parts) { 
      return parts.filter(Boolean).join('/').replace(/\\/+/g, '/'); 
    }
    export function resolve(...parts) { 
      return parts.filter(Boolean).join('/').replace(/\\/+/g, '/');
    }
    export function dirname(path) { 
      if (!path) return '.';
      const segments = path.split('/');
      return segments.length > 1 ? segments.slice(0, -1).join('/') : '.';
    }
    export function basename(path, ext) { 
      if (!path) return '';
      const base = path.split('/').pop() || '';
      return ext && base.endsWith(ext) ? base.slice(0, -ext.length) : base;
    }
    export function extname(path) {
      if (!path) return '';
      const base = path.split('/').pop() || '';
      const idx = base.lastIndexOf('.');
      return idx !== -1 ? base.slice(idx) : '';
    }
    export function isAbsolute(path) {
      return path.startsWith('/');
    }
    export function parse(path) {
      const dir = dirname(path);
      const base = basename(path);
      const ext = extname(path);
      const name = ext ? base.slice(0, -ext.length) : base;
      return { root: '', dir, base, ext, name };
    }
    export function relative(from, to) {
      // Simple implementation for browser
      return to;
    }
    export const sep = '/';
    export const delimiter = ':';
    export default { 
      join, resolve, dirname, basename, extname, 
      isAbsolute, parse, relative, sep, delimiter
    };
  `,
  fs: `
    const fsError = (name) => () => { 
      throw new Error(\`fs.\${name} is not supported in the browser\`); 
    };
    
    export const readFileSync = fsError('readFileSync');
    export const writeFileSync = fsError('writeFileSync');
    export const existsSync = () => false;
    export const readdirSync = fsError('readdirSync');
    export const statSync = fsError('statSync');
    export const mkdirSync = fsError('mkdirSync');
    export const readFile = (path, options, callback) => {
      if (typeof options === 'function') {
        callback = options;
      }
      setTimeout(() => callback(new Error('fs.readFile is not supported in the browser')), 0);
    };
    export const writeFile = (path, data, options, callback) => {
      if (typeof options === 'function') {
        callback = options;
      }
      setTimeout(() => callback(new Error('fs.writeFile is not supported in the browser')), 0);
    };
    
    export const promises = {
      readFile: () => Promise.reject(new Error('fs.promises.readFile is not supported in the browser')),
      writeFile: () => Promise.reject(new Error('fs.promises.writeFile is not supported in the browser')),
      mkdir: () => Promise.reject(new Error('fs.promises.mkdir is not supported in the browser')),
      stat: () => Promise.reject(new Error('fs.promises.stat is not supported in the browser')),
    };
    
    export default { 
      readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync,
      readFile, writeFile, promises
    };
  `,
  events: `
    export class EventEmitter {
      constructor() {
        this._events = {};
      }
      
      on(event, listener) {
        if (!this._events[event]) this._events[event] = [];
        this._events[event].push(listener);
        return this;
      }
      
      once(event, listener) {
        const onceWrapper = (...args) => {
          listener(...args);
          this.off(event, onceWrapper);
        };
        this.on(event, onceWrapper);
        return this;
      }
      
      off(event, listener) {
        if (this._events[event]) {
          this._events[event] = this._events[event].filter(l => l !== listener);
        }
        return this;
      }
      
      emit(event, ...args) {
        if (this._events[event]) {
          this._events[event].forEach(listener => listener(...args));
        }
        return !!this._events[event];
      }
      
      removeAllListeners(event) {
        if (event) {
          delete this._events[event];
        } else {
          this._events = {};
        }
        return this;
      }
    }
    
    export default { EventEmitter };
  `,
  util: `
    export function promisify(fn) {
      return (...args) => {
        return new Promise((resolve, reject) => {
          fn(...args, (err, ...results) => {
            if (err) return reject(err);
            if (results.length === 1) return resolve(results[0]);
            resolve(results);
          });
        });
      };
    }
    
    export function inherits(ctor, superCtor) {
      ctor.super_ = superCtor;
      Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
    }
    
    export function format(format, ...args) {
      return String(format).replace(/%[sdj%]/g, (match) => {
        if (match === '%%') return '%';
        if (args.length === 0) return match;
        const value = args.shift();
        if (match === '%s') return String(value);
        if (match === '%d') return Number(value).toString();
        if (match === '%j') return JSON.stringify(value);
        return match;
      });
    }
    
    export function inspect(obj) {
      return JSON.stringify(obj);
    }
    
    export default { promisify, inherits, format, inspect };
  `,
  stream: `
    import { EventEmitter } from 'events';
    
    class Stream extends EventEmitter {
      pipe(dest) {
        return dest;
      }
    }
    
    class Readable extends Stream {
      constructor(options) {
        super();
        this._options = options || {};
      }
      
      read() {
        return null;
      }
      
      push() {
        return false;
      }
      
      pipe(dest) {
        this.on('data', chunk => {
          dest.write(chunk);
        });
        
        this.on('end', () => {
          dest.end();
        });
        
        return dest;
      }
    }
    
    class Writable extends Stream {
      constructor(options) {
        super();
        this._options = options || {};
      }
      
      write(chunk) {
        return true;
      }
      
      end() {
        this.emit('finish');
        return true;
      }
    }
    
    class Duplex extends Readable {
      constructor(options) {
        super(options);
      }
      
      write(chunk) {
        return true;
      }
      
      end() {
        this.emit('finish');
        return true;
      }
    }
    
    class Transform extends Duplex {
      constructor(options) {
        super(options);
      }
      
      _transform(chunk, encoding, callback) {
        callback();
      }
    }
    
    export { Stream, Readable, Writable, Duplex, Transform };
    export default { Stream, Readable, Writable, Duplex, Transform };
  `,
  buffer: `
    export class Buffer extends Uint8Array {
      static from(value, encoding) {
        if (typeof value === 'string') {
          const encoder = new TextEncoder();
          return new Buffer(encoder.encode(value));
        }
        return new Buffer(value);
      }
      
      static alloc(size) {
        return new Buffer(size);
      }
      
      static isBuffer(obj) {
        return obj instanceof Buffer;
      }
      
      toString(encoding) {
        const decoder = new TextDecoder();
        return decoder.decode(this);
      }
    }
    
    Buffer.isBuffer = function(obj) {
      return obj instanceof Buffer;
    };
    
    export default { Buffer };
  `,
};