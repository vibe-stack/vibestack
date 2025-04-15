"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { ChevronRight, ChevronDown, Plus, Search, Trash2, Layers } from "lucide-react"
import { useSceneHierarchyStore, SceneNode } from "@/store/scene-hierarchy-store"

interface SceneHierarchyProps {
  onSelectNode?: (nodeId: string) => void
  selectedNode?: string | null
}

export default function SceneHierarchy({ onSelectNode, selectedNode }: SceneHierarchyProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { sceneNodes, toggleNodeExpanded } = useSceneHierarchyStore()

  const handleNodeSelect = (nodeId: string) => {
    if (onSelectNode) {
      onSelectNode(nodeId)
    }
  }

  const renderNode = (node: SceneNode, depth = 0) => {
    // Skip nodes that don't match search
    if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      // But still check children
      if (node.children) {
        const matchingChildren = node.children.map((child) => renderNode(child, depth + 1)).filter(Boolean)

        if (matchingChildren.length > 0) {
          return (
            <div key={node.id}>
              <div
                className={`flex items-center py-1.5 px-2 rounded-lg my-0.5 ${
                  selectedNode === node.id ? "bg-emerald-900/40" : "hover:bg-zinc-800/40"
                }`}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={() => handleNodeSelect(node.id)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 mr-1 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleNodeExpanded(node.id)
                  }}
                >
                  {node.children && node.children.length > 0 ? (
                    node.expanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )
                  ) : (
                    <div className="w-3" />
                  )}
                </Button>
                <span className="text-sm truncate">{node.name}</span>
                <span className="text-xs text-zinc-400 ml-1 opacity-70">({node.type})</span>
              </div>
              {node.expanded && matchingChildren}
            </div>
          )
        }
        return null
      }
      return null
    }

    return (
      <div key={node.id}>
        <div
          className={`flex items-center py-1.5 px-2 rounded-lg my-0.5 ${
            selectedNode === node.id ? "bg-emerald-900/40" : "hover:bg-zinc-800/40"
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => handleNodeSelect(node.id)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 mr-1 rounded-full"
            onClick={(e) => {
              e.stopPropagation()
              toggleNodeExpanded(node.id)
            }}
          >
            {node.children && node.children.length > 0 ? (
              node.expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )
            ) : (
              <div className="w-3" />
            )}
          </Button>
          <span className="text-sm truncate">{node.name}</span>
          <span className="text-xs text-zinc-400 ml-1 opacity-70">({node.type})</span>
        </div>
        {node.expanded && node.children && node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    )
  }

  // Show a placeholder when no scene nodes are available
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="text-zinc-400 mb-2">
        <Layers className="h-12 w-12 mx-auto mb-2 opacity-20" />
        <p className="text-sm">No scene available</p>
        <p className="text-xs opacity-70 mt-1">Run the game to see the scene hierarchy</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search scene..."
            className="pl-9 h-9 bg-zinc-800/30 border-0 rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1 px-3 h-64">
        <div className="pb-3">
          {sceneNodes.length > 0 
            ? sceneNodes.map((node) => renderNode(node)) 
            : renderEmptyState()}
        </div>
      </ScrollArea>
      {/* <div className="p-3 flex justify-between">
        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full bg-zinc-800/30 hover:bg-zinc-800/70">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full bg-zinc-800/30 hover:bg-zinc-800/70">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div> */}
    </div>
  )
}
