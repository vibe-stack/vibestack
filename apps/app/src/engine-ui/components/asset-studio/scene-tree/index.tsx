import { useState } from "react";
import { useThreeDEditorStore, ThreeDObject } from "@/store/three-editor-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronDown, Search, Layers, Eye, EyeOff } from "lucide-react";

export default function SceneTree() {
  const [searchQuery, setSearchQuery] = useState("");
  const { objects, selectedObjectId, selectObject, updateObject } = useThreeDEditorStore();

  const handleNodeSelect = (id: string) => {
    selectObject(id);
  };

  const toggleExpanded = (object: ThreeDObject, e: React.MouseEvent) => {
    e.stopPropagation();
    updateObject(object.id, { expanded: !object.expanded });
  };

  const toggleVisibility = (object: ThreeDObject, e: React.MouseEvent) => {
    e.stopPropagation();
    updateObject(object.id, { visible: !object.visible });
  };

  const renderObject = (object: ThreeDObject, depth = 0) => {
    // Skip objects that don't match search
    if (searchQuery && !object.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      // But still check children
      if (object.children && object.children.length > 0) {
        const matchingChildren = object.children
          .map((child: ThreeDObject) => renderObject(child, depth + 1))
          .filter(Boolean);

        if (matchingChildren.length > 0) {
          return (
            <div key={object.id}>
              <div
                className={`flex items-center py-1 px-2 rounded-lg my-0.5 transition-all duration-150 ${
                  selectedObjectId === object.id
                    ? "bg-green-900/20 border border-green-400/20 shadow-[0_2px_8px_0_rgba(16,255,120,0.04)] text-green-100"
                    : "hover:bg-zinc-800/30"
                }`}
                style={{ paddingLeft: `${depth * 10 + 6}px` }}
                onClick={() => handleNodeSelect(object.id)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 mr-1 rounded-full"
                  onClick={(e) => toggleExpanded(object, e)}
                >
                  {object.children && object.children.length > 0 ? (
                    object.expanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )
                  ) : (
                    <div className="w-3" />
                  )}
                </Button>
                <span className="text-sm truncate flex-1">{object.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 rounded-full opacity-60 hover:opacity-100"
                  onClick={(e) => toggleVisibility(object, e)}
                >
                  {object.visible ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                </Button>
              </div>
              {object.expanded && matchingChildren}
            </div>
          );
        }
        return null;
      }
      return null;
    }

    return (
      <div key={object.id}>
        <div
          className={`flex items-center py-1 px-2 rounded-lg my-0.5 transition-all duration-150 ${
            selectedObjectId === object.id
              ? "bg-green-900/20 border border-green-400/20 shadow-[0_2px_8px_0_rgba(16,255,120,0.04)] text-green-100"
              : "hover:bg-zinc-800/30"
          }`}
          style={{ paddingLeft: `${depth * 10 + 6}px` }}
          onClick={() => handleNodeSelect(object.id)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 mr-1 rounded-full"
            onClick={(e) => toggleExpanded(object, e)}
          >
            {object.children && object.children.length > 0 ? (
              object.expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )
            ) : (
              <div className="w-3" />
            )}
          </Button>
          <span className="text-sm truncate flex-1">{object.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 rounded-full opacity-60 hover:opacity-100"
            onClick={(e) => toggleVisibility(object, e)}
          >
            {object.visible ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
          </Button>
        </div>
        {object.expanded && object.children && object.children.map((child: ThreeDObject) => renderObject(child, depth + 1))}
      </div>
    );
  };

  // Empty state when no objects are available
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="text-zinc-400 mb-2">
        <Layers className="h-12 w-12 mx-auto mb-2 opacity-20" />
        <p className="text-sm">No objects in scene</p>
        <p className="text-xs opacity-70 mt-1">Add objects to populate the scene</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-green-900/40" />
          <Input
            placeholder="Search objects..."
            className="pl-8 h-7 bg-zinc-900/30 border border-green-900/10 rounded-lg text-xs focus:ring-1 focus:ring-green-400/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="pb-2">
          {objects.length > 0 ? objects.map((object) => renderObject(object)) : renderEmptyState()}
        </div>
      </ScrollArea>
    </div>
  );
} 