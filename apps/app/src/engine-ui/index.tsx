"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Code,
  Layers,
  Play,
  ImageIcon,
  Settings,
  MessageSquare,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
// import GamePreview from "./components/game-preview";
import dynamic from "next/dynamic";
import CodeEditor from "./components/code-editor";
import SceneHierarchy from "./components/scene-hierarchy";
import AssetsPanel from "./components/assets-panel";
import Inspector from "./components/inspector";
import LLMAssistant from "./components/llm-assistant";
import { useSceneHierarchyStore } from "@/store/scene-hierarchy-store";
import FilesPanel from "./components/files-panel";
import { Badge } from "@/components/ui/badge";
import TopBar from "./components/top-bar";

const GamePreview = dynamic(() => import("./components/game-preview"), {
  ssr: false,
});

export default function EngineUI() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("preview");
  const [, setShowChat] = useState(false);
  
  // Use the scene hierarchy store for the selected node
  const { selectedNodeId, setSelectedNode } = useSceneHierarchyStore();

  // Handle node selection
  const handleSelectNode = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-200">
      <TopBar />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Navigation */}
        {isMobile && (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full flex flex-col flex-1"
          >
            <TabsList className="grid grid-cols-4 h-12 bg-zinc-900/30 mx-2 mt-2 rounded-xl">
              <TabsTrigger
                value="preview"
                className="flex flex-col items-center justify-center py-1 rounded-lg data-[state=active]:bg-zinc-800/50"
              >
                <Play className="h-4 w-4" />
                <span className="text-xs">Preview</span>
              </TabsTrigger>
              <TabsTrigger
                value="scene"
                className="flex flex-col items-center justify-center py-1 rounded-lg data-[state=active]:bg-zinc-800/50"
              >
                <Layers className="h-4 w-4" />
                <span className="text-xs">Scene</span>
              </TabsTrigger>
              <TabsTrigger
                value="code"
                className="flex flex-col items-center justify-center py-1 rounded-lg data-[state=active]:bg-zinc-800/50"
              >
                <Code className="h-4 w-4" />
                <span className="text-xs">Code</span>
              </TabsTrigger>
              <TabsTrigger
                value="assets"
                className="flex flex-col items-center justify-center py-1 rounded-lg data-[state=active]:bg-zinc-800/50 relative"
                disabled
              >
                <ImageIcon className="h-4 w-4" />
                <span className="text-xs">Assets</span>
                <Badge className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-zinc-700 text-zinc-300 px-1.5 py-0.5 text-[10px] font-semibold" variant="secondary">soon</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 p-0 m-0 w-full mt-2">
              <div className="w-full h-full rounded-lg overflow-hidden">
                <GamePreview />
              </div>
            </TabsContent>

            <TabsContent value="scene" className="flex-1 p-0 m-0 w-full mt-2">
              {/* Combined Scene Hierarchy and Inspector on mobile */}
              {selectedNodeId ? (
                <Tabs defaultValue="hierarchy" className="flex-1 w-full">
                  <TabsList className="mx-2 justify-start bg-zinc-900/30 rounded-xl">
                    <TabsTrigger value="hierarchy" className="rounded-lg">
                      Hierarchy
                    </TabsTrigger>
                    <TabsTrigger value="inspector" className="rounded-lg relative" disabled>
                      Inspector
                      <Badge className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-zinc-700 text-zinc-300 px-1.5 py-0.5 text-[10px] font-semibold" variant="secondary">soon</Badge>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent
                    value="hierarchy"
                    className="flex-1 p-0 m-0 w-full mt-2"
                  >
                    <div className="bg-zinc-900/30 rounded-xl overflow-hidden">
                      <SceneHierarchy
                        onSelectNode={handleSelectNode}
                        selectedNode={selectedNodeId}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent
                    value="inspector"
                    className="flex-1 p-0 m-0 w-full mt-2"
                  >
                    <div className="bg-zinc-900/30 rounded-xl overflow-hidden">
                      <Inspector nodeId={selectedNodeId} />
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="bg-zinc-900/30 rounded-xl overflow-hidden">
                  <SceneHierarchy
                    onSelectNode={handleSelectNode}
                    selectedNode={selectedNodeId}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="code" className="flex-1 p-0 m-0 w-full mt-2">
              <div className="w-full h-full bg-zinc-900/30 rounded-xl overflow-hidden">
                <CodeEditor />
              </div>
            </TabsContent>

            <TabsContent value="assets" className="flex-1 p-0 m-0 w-full mt-2">
              <div className="w-full h-full bg-zinc-900/30 rounded-xl overflow-hidden">
                <AssetsPanel />
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Desktop Layout */}
        {!isMobile && (
          <ResizablePanelGroup
            direction="horizontal"
            className="flex-1 p-2 gap-2"
          >
            {/* Left Panel - Scene Hierarchy & Files */}
            <ResizablePanel
              defaultSize={20}
              minSize={15}
              maxSize={30}
              className="flex flex-col bg-zinc-900/30 rounded-xl overflow-hidden"
            >
              <Tabs defaultValue="files" className="flex-1 flex flex-col">
                <TabsList className="justify-start bg-zinc-900/30 rounded-xl w-fit">
                  <TabsTrigger value="scene" className="flex items-center rounded-lg">
                    <Layers className="h-4 w-4 mr-2" />
                    Scene Hierarchy
                  </TabsTrigger>
                  <TabsTrigger value="files" className="flex items-center rounded-lg">
                    <Code className="h-4 w-4 mr-2" />
                    Files
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="scene" className="flex-1 p-0 m-0 mt-2">
                  <div className="bg-zinc-900/30 rounded-xl overflow-hidden h-full">
                    <SceneHierarchy
                      onSelectNode={handleSelectNode}
                      selectedNode={selectedNodeId}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="files" className="flex-1 p-0 m-0 mt-2">
                  <div className="bg-zinc-900/30 rounded-xl overflow-hidden h-full">
                    <FilesPanel />
                  </div>
                </TabsContent>
              </Tabs>
            </ResizablePanel>

            <ResizableHandle className="bg-transparent before:bg-zinc-800 before:rounded-full" />

            {/* Middle Panel - Preview/Code Editor */}
            <ResizablePanel defaultSize={50} className="flex flex-col">
              <Tabs defaultValue="preview" className="flex-1 flex flex-col">
                <TabsList className="justify-start bg-zinc-900/30 rounded-xl w-fit">
                  <TabsTrigger
                    value="preview"
                    className="flex items-center rounded-lg"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger
                    value="code"
                    className="flex items-center rounded-lg"
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Code Editor
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="flex-1 p-0 m-0 mt-2">
                  <div className="bg-zinc-900/30 rounded-xl overflow-hidden h-full">
                    <GamePreview />
                  </div>
                </TabsContent>
                <TabsContent value="code" className="flex-1 p-0 m-0 mt-2">
                  <div className="bg-zinc-900/30 rounded-xl overflow-hidden h-full">
                    <CodeEditor />
                  </div>
                </TabsContent>
              </Tabs>
            </ResizablePanel>

            <ResizableHandle className="bg-transparent before:bg-zinc-800 before:rounded-full" />

            {/* Right Panel - Assets/Inspector/Chat */}
            <ResizablePanel
              defaultSize={30}
              minSize={20}
              maxSize={40}
              className="flex flex-col"
            >
              <Tabs defaultValue="chat" className="flex-1 flex flex-col">
                <TabsList className="justify-start bg-zinc-900/30 rounded-xl w-fit">
                  <TabsTrigger
                    value="chat"
                    className="flex items-center rounded-lg"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger
                    value="inspector"
                    className="flex items-center rounded-lg relative"
                    disabled
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Inspector
                    <Badge className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-zinc-700 text-zinc-300 px-1.5 py-0.5 text-[10px] font-semibold" variant="secondary">soon</Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="assets"
                    className="flex items-center rounded-lg relative"
                    disabled
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Assets
                    <Badge className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-zinc-700 text-zinc-300 px-1.5 py-0.5 text-[10px] font-semibold" variant="secondary">soon</Badge>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="inspector" className="flex-1 p-0 m-0 mt-2">
                  <div className="bg-zinc-900/30 rounded-xl overflow-hidden h-full">
                    <Inspector nodeId={selectedNodeId} />
                  </div>
                </TabsContent>
                <TabsContent value="assets" className="flex-1 p-0 m-0 mt-2">
                  <div className="bg-zinc-900/30 rounded-xl overflow-hidden h-full">
                    <AssetsPanel />
                  </div>
                </TabsContent>
                <TabsContent value="chat" className="flex-1 p-0 m-0 mt-2">
                  <div className="bg-zinc-900/30 rounded-xl overflow-hidden h-full max-h-full">
                    <LLMAssistant
                      onClose={() => setShowChat(false)}
                      isDesktopPanel
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}

        {/* Mobile AI Assistant */}
        {isMobile && <LLMAssistant onClose={() => setShowChat(false)} />}
      </div>
    </div>
  );
}
