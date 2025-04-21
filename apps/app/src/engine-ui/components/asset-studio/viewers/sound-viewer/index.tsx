export default function SoundViewer({ url }: { url: string }) {
  return <div className="flex items-center justify-center h-full w-full"><audio controls src={url} className="w-full" /></div>
} 