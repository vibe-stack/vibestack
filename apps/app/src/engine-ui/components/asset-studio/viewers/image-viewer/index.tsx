export default function ImageViewer({ url, alt }: { url: string, alt?: string }) {
  return <div className="flex items-center justify-center h-full"><img src={url} alt={alt || ''} className="max-h-full max-w-full rounded-xl" /></div>
} 