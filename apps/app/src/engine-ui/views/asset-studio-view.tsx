import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Drawer, DrawerTrigger, DrawerContent } from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ImageIcon, Box, Music } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import AssetViewer from "../components/asset-studio/viewers/asset-viewer"

const assets = [
  { id: "mod1", name: "character.glb", type: "model", url: "/placeholder.glb", thumbnail: "/placeholder.svg?height=80&width=80" },
  { id: "img1", name: "player.png", type: "image", url: "/placeholder.png", thumbnail: "/placeholder.svg?height=80&width=80" },
  { id: "img2", name: "enemy.png", type: "image", url: "/placeholder.png", thumbnail: "/placeholder.svg?height=80&width=80" },
  { id: "aud1", name: "jump.mp3", type: "audio", url: "/placeholder.mp3", thumbnail: "/placeholder.svg?height=80&width=80" },
  { id: "aud2", name: "music.mp3", type: "audio", url: "/placeholder.mp3", thumbnail: "/placeholder.svg?height=80&width=80" },
]

const assetTabs = [
  { key: "models", label: "Models", icon: <Box className="h-4 w-4" />, type: "model" },
  { key: "images", label: "Images", icon: <ImageIcon className="h-4 w-4" />, type: "image" },
  { key: "sounds", label: "Sounds", icon: <Music className="h-4 w-4" />, type: "audio" },
]

export default function AssetStudioView() {
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState(assetTabs[0].key)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)

  const filteredAssets = assets.filter(a => a.type === assetTabs.find(t => t.key === activeTab)?.type)

  if (isMobile) {
    return (
      <div className="flex flex-col h-full w-full">
        <div className="flex items-center gap-2 px-2 pt-2 pb-1 bg-zinc-900/60 border-b border-green-900/10">
          {assetTabs.map(tab => (
            <button
              key={tab.key}
              className={`flex-1 flex flex-col items-center py-2 rounded-lg transition-colors ${activeTab === tab.key ? 'bg-zinc-800/50 text-green-300' : 'bg-zinc-900/30 text-zinc-400'}`}
              onClick={() => { setActiveTab(tab.key); setDrawerOpen(true) }}
              type="button"
            >
              {tab.icon}
              <span className="text-xs mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild />
          <DrawerContent className="max-h-[80dvh] p-0 rounded-t-xl overflow-hidden">
            <ScrollArea className="h-full max-h-[70dvh] px-4 py-4">
              <div className="grid grid-cols-3 gap-3">
                {filteredAssets.map(asset => (
                  <button
                    key={asset.id}
                    className={`bg-zinc-800/20 rounded-xl p-2 flex flex-col items-center border border-green-900/10 cursor-pointer transition-all duration-150 ${selectedAsset?.id === asset.id ? 'ring-2 ring-green-400' : ''}`}
                    onClick={() => { setSelectedAsset(asset); setDrawerOpen(false) }}
                  >
                    <img src={asset.thumbnail} alt={asset.name} className="w-full aspect-square object-cover rounded-lg mb-2" />
                    <span className="text-xs truncate w-full text-center">{asset.name}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </DrawerContent>
        </Drawer>
        <div className="flex-1 min-h-0">
          <AssetViewer asset={selectedAsset} />
        </div>
      </div>
    )
  }

  // Desktop split view
  return (
    <div className="flex flex-row h-full w-full gap-2 p-2">
      <div className="flex flex-col bg-zinc-900/30 rounded-xl overflow-hidden min-w-[260px] max-w-[340px] w-1/3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="justify-start bg-zinc-900/30 rounded-xl w-fit mx-2 mt-2">
            {assetTabs.map(tab => (
              <TabsTrigger key={tab.key} value={tab.key} className="flex items-center gap-1 rounded-lg">
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={activeTab} className="flex-1 p-0 m-0 mt-2">
            <ScrollArea className="h-full px-3 pb-3">
              <div className="grid grid-cols-2 gap-3">
                {filteredAssets.map(asset => (
                  <button
                    key={asset.id}
                    className={`bg-zinc-800/20 rounded-xl p-2 flex flex-col items-center border border-green-900/10 cursor-pointer transition-all duration-150 ${selectedAsset?.id === asset.id ? 'ring-2 ring-green-400' : ''}`}
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <img src={asset.thumbnail} alt={asset.name} className="w-full aspect-square object-cover rounded-lg mb-2" />
                    <span className="text-xs truncate w-full text-center">{asset.name}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
      <div className="flex-1 min-w-0 bg-zinc-900/30 rounded-xl overflow-hidden flex flex-col">
        <AssetViewer asset={selectedAsset} />
      </div>
    </div>
  )
}
