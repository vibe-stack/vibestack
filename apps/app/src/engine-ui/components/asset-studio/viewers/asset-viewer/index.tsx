import ModelViewer from "../model-viewer"
import ImageViewer from "../image-viewer"
import SoundViewer from "../sound-viewer"

export default function AssetViewer({ asset }: { asset: any }) {
  if (!asset) return <div className="flex items-center justify-center h-full text-zinc-400 text-sm">Select an asset</div>
  if (asset.type === "image") return <ImageViewer url={asset.url} alt={asset.name} />
  if (asset.type === "audio") return <SoundViewer url={asset.url} />
  if (asset.type === "model") return <ModelViewer url={asset.url} />
  return null
} 