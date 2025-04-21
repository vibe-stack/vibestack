export default function ModelViewer({ url }: { url: string }) {
  if (typeof window !== 'undefined' && window.customElements?.get('model-viewer')) {
    // @ts-expect-error: model-viewer is a custom element, not typed by React
    return <model-viewer src={url} style={{ width: '100%', height: '320px', background: 'transparent' }} camera-controls auto-rotate />
  }
  return <div className="flex flex-col items-center justify-center w-full h-80 text-zinc-400">3D Viewer<br />[model-viewer not available]</div>
} 