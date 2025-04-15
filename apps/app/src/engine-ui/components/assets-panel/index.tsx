"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Upload, FolderPlus, Grid, List } from "lucide-react"

interface Asset {
  id: string
  name: string
  type: "image" | "audio" | "script" | "prefab" | "model"
  thumbnail: string
}

export default function AssetsPanel() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [assets] = useState<Asset[]>([
    { id: "img1", name: "player.png", type: "image", thumbnail: "/placeholder.svg?height=80&width=80" },
    { id: "img2", name: "enemy.png", type: "image", thumbnail: "/placeholder.svg?height=80&width=80" },
    { id: "img3", name: "background.png", type: "image", thumbnail: "/placeholder.svg?height=80&width=80" },
    { id: "img4", name: "tileset.png", type: "image", thumbnail: "/placeholder.svg?height=80&width=80" },
    { id: "aud1", name: "jump.mp3", type: "audio", thumbnail: "/placeholder.svg?height=80&width=80" },
    { id: "aud2", name: "music.mp3", type: "audio", thumbnail: "/placeholder.svg?height=80&width=80" },
    { id: "scr1", name: "player.js", type: "script", thumbnail: "/placeholder.svg?height=80&width=80" },
    { id: "scr2", name: "enemy.js", type: "script", thumbnail: "/placeholder.svg?height=80&width=80" },
    { id: "pre1", name: "enemyPrefab.json", type: "prefab", thumbnail: "/placeholder.svg?height=80&width=80" },
    { id: "mod1", name: "character.glb", type: "model", thumbnail: "/placeholder.svg?height=80&width=80" },
  ])

  const filteredAssets = assets.filter((asset) => asset.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-2">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-green-900/40" />
          <Input
            placeholder="Search assets..."
            className="pl-8 h-7 bg-zinc-900/30 border border-green-900/10 rounded-lg text-xs focus:ring-1 focus:ring-green-400/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex justify-between">
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="h-7 rounded-lg bg-zinc-900/30 border border-green-900/10 text-xs">
              <Upload className="h-4 w-4 mr-2 opacity-70" />
              Import
            </Button>
            <Button variant="outline" size="sm" className="h-7 rounded-lg bg-zinc-900/30 border border-green-900/10 text-xs">
              <FolderPlus className="h-4 w-4 mr-2 opacity-70" />
              New Folder
            </Button>
          </div>
          <div className="flex gap-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className={`h-7 w-7 rounded-lg ${viewMode === "grid" ? 'bg-green-900/20 border border-green-400/20' : ''}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className={`h-7 w-7 rounded-lg ${viewMode === "list" ? 'bg-green-900/20 border border-green-400/20' : ''}`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="mx-3 justify-start bg-zinc-900/30 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg">
            All
          </TabsTrigger>
          <TabsTrigger value="images" className="rounded-lg">
            Images
          </TabsTrigger>
          <TabsTrigger value="audio" className="rounded-lg">
            Audio
          </TabsTrigger>
          <TabsTrigger value="scripts" className="rounded-lg">
            Scripts
          </TabsTrigger>
          <TabsTrigger value="prefabs" className="rounded-lg">
            Prefabs
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 px-3">
          <TabsContent value="all" className="m-0 py-3">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="bg-zinc-800/20 rounded-xl p-2 flex flex-col items-center hover:bg-green-900/10 border border-green-900/10 cursor-pointer transition-all duration-150"
                  >
                    <img
                      src={asset.thumbnail || "/placeholder.svg"}
                      alt={asset.name}
                      className="w-full aspect-square object-cover rounded-lg mb-2"
                    />
                    <span className="text-xs truncate w-full text-center">{asset.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center p-2 hover:bg-green-900/10 border border-green-900/10 rounded-lg cursor-pointer transition-all duration-150"
                  >
                    <img
                      src={asset.thumbnail || "/placeholder.svg"}
                      alt={asset.name}
                      className="w-9 h-9 object-cover rounded-lg mr-3"
                    />
                    <span className="text-sm">{asset.name}</span>
                    <span className="text-xs text-zinc-400 ml-auto">{asset.type}</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="images" className="m-0 py-3">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredAssets
                  .filter((a) => a.type === "image")
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="bg-zinc-800/20 rounded-xl p-2 flex flex-col items-center hover:bg-green-900/10 border border-green-900/10 cursor-pointer transition-all duration-150"
                    >
                      <img
                        src={asset.thumbnail || "/placeholder.svg"}
                        alt={asset.name}
                        className="w-full aspect-square object-cover rounded-lg mb-2"
                      />
                      <span className="text-xs truncate w-full text-center">{asset.name}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredAssets
                  .filter((a) => a.type === "image")
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center p-2 hover:bg-green-900/10 border border-green-900/10 rounded-lg cursor-pointer transition-all duration-150"
                    >
                      <img
                        src={asset.thumbnail || "/placeholder.svg"}
                        alt={asset.name}
                        className="w-9 h-9 object-cover rounded-lg mr-3"
                      />
                      <span className="text-sm">{asset.name}</span>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="audio" className="m-0 py-3">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredAssets
                  .filter((a) => a.type === "audio")
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="bg-zinc-800/20 rounded-xl p-2 flex flex-col items-center hover:bg-green-900/10 border border-green-900/10 cursor-pointer transition-all duration-150"
                    >
                      <img
                        src={asset.thumbnail || "/placeholder.svg"}
                        alt={asset.name}
                        className="w-full aspect-square object-cover rounded-lg mb-2"
                      />
                      <span className="text-xs truncate w-full text-center">{asset.name}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredAssets
                  .filter((a) => a.type === "audio")
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center p-2 hover:bg-green-900/10 border border-green-900/10 rounded-lg cursor-pointer transition-all duration-150"
                    >
                      <img
                        src={asset.thumbnail || "/placeholder.svg"}
                        alt={asset.name}
                        className="w-9 h-9 object-cover rounded-lg mr-3"
                      />
                      <span className="text-sm">{asset.name}</span>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="scripts" className="m-0 py-3">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredAssets
                  .filter((a) => a.type === "script")
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="bg-zinc-800/20 rounded-xl p-2 flex flex-col items-center hover:bg-green-900/10 border border-green-900/10 cursor-pointer transition-all duration-150"
                    >
                      <img
                        src={asset.thumbnail || "/placeholder.svg"}
                        alt={asset.name}
                        className="w-full aspect-square object-cover rounded-lg mb-2"
                      />
                      <span className="text-xs truncate w-full text-center">{asset.name}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredAssets
                  .filter((a) => a.type === "script")
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center p-2 hover:bg-green-900/10 border border-green-900/10 rounded-lg cursor-pointer transition-all duration-150"
                    >
                      <img
                        src={asset.thumbnail || "/placeholder.svg"}
                        alt={asset.name}
                        className="w-9 h-9 object-cover rounded-lg mr-3"
                      />
                      <span className="text-sm">{asset.name}</span>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="prefabs" className="m-0 py-3">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredAssets
                  .filter((a) => a.type === "prefab")
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="bg-zinc-800/20 rounded-xl p-2 flex flex-col items-center hover:bg-green-900/10 border border-green-900/10 cursor-pointer transition-all duration-150"
                    >
                      <img
                        src={asset.thumbnail || "/placeholder.svg"}
                        alt={asset.name}
                        className="w-full aspect-square object-cover rounded-lg mb-2"
                      />
                      <span className="text-xs truncate w-full text-center">{asset.name}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredAssets
                  .filter((a) => a.type === "prefab")
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center p-2 hover:bg-green-900/10 border border-green-900/10 rounded-lg cursor-pointer transition-all duration-150"
                    >
                      <img
                        src={asset.thumbnail || "/placeholder.svg"}
                        alt={asset.name}
                        className="w-9 h-9 object-cover rounded-lg mr-3"
                      />
                      <span className="text-sm">{asset.name}</span>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}
