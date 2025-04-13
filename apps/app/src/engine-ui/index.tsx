"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Code,
  Layers,
  Play,
  Pause,
  ImageIcon,
  Settings,
  Menu,
  MessageSquare,
  ChevronRight,
  Plus,
  Save,
  Download,
  Upload,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
// import GamePreview from "./components/game-preview";
import dynamic from "next/dynamic";
import CodeEditor from "./components/code-editor";
import SceneHierarchy from "./components/scene-hierarchy";
import AssetsPanel from "./components/assets-panel";
import Inspector from "./components/inspector";
import LLMAssistant from "./components/llm-assistant";

const GamePreview = dynamic(() => import("./components/game-preview"), {
  ssr: false,
});

export default function EngineUI() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("preview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>("player1");
  const [,setShowChat] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-200">
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-lg tracking-tight">GGEZ</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="rounded-lg">
            <Play className="h-4 w-4 mr-2 fill-zinc-200" />
            {!isMobile && "Run"}
          </Button>
        </div>
      </header>

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
                className="flex flex-col items-center justify-center py-1 rounded-lg data-[state=active]:bg-zinc-800/50"
              >
                <ImageIcon className="h-4 w-4" />
                <span className="text-xs">Assets</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 p-0 m-0 w-full mt-2">
              <div className="w-full h-full rounded-lg overflow-hidden">
                <GamePreview />
              </div>
            </TabsContent>

            <TabsContent value="scene" className="flex-1 p-0 m-0 w-full mt-2">
              {/* Combined Scene Hierarchy and Inspector on mobile */}
              {selectedNode ? (
                <Tabs defaultValue="hierarchy" className="flex-1 w-full">
                  <TabsList className="mx-2 justify-start bg-zinc-900/30 rounded-xl">
                    <TabsTrigger value="hierarchy" className="rounded-lg">
                      Hierarchy
                    </TabsTrigger>
                    <TabsTrigger value="inspector" className="rounded-lg">
                      Inspector
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent
                    value="hierarchy"
                    className="flex-1 p-0 m-0 w-full mt-2"
                  >
                    <div className="bg-zinc-900/30 rounded-xl overflow-hidden">
                      <SceneHierarchy
                        onSelectNode={setSelectedNode}
                        selectedNode={selectedNode}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent
                    value="inspector"
                    className="flex-1 p-0 m-0 w-full mt-2"
                  >
                    <div className="bg-zinc-900/30 rounded-xl overflow-hidden">
                      <Inspector nodeId={selectedNode} />
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="bg-zinc-900/30 rounded-xl overflow-hidden">
                  <SceneHierarchy
                    onSelectNode={setSelectedNode}
                    selectedNode={selectedNode}
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
            {/* Left Panel - Scene Hierarchy */}
            <ResizablePanel
              defaultSize={20}
              minSize={15}
              maxSize={30}
              className="flex flex-col bg-zinc-900/30 rounded-xl overflow-hidden"
            >
              <div className="p-3 font-medium flex items-center justify-between">
                <div className="flex items-center">
                  <Layers className="h-4 w-4 mr-2 opacity-70" />
                  <span className="tracking-tight">Scene Hierarchy</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <SceneHierarchy
                onSelectNode={setSelectedNode}
                selectedNode={selectedNode}
              />
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
                    className="flex items-center rounded-lg"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Inspector
                  </TabsTrigger>
                  <TabsTrigger
                    value="assets"
                    className="flex items-center rounded-lg"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Assets
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="inspector" className="flex-1 p-0 m-0 mt-2">
                  <div className="bg-zinc-900/30 rounded-xl overflow-hidden h-full">
                    <Inspector nodeId={selectedNode} />
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

        {/* Mobile Menu - Slide in from left */}
        <div
          className={`fixed inset-y-0 left-0 w-64 bg-zinc-900/95 backdrop-blur-md shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 flex items-center justify-between">
            <h2 className="font-semibold tracking-tight">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setMenuOpen(false)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              <div>
                <h3 className="font-medium mb-3 text-sm text-zinc-400 tracking-wide">
                  PROJECT
                </h3>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-lg"
                  >
                    <Save className="h-4 w-4 mr-2 opacity-70" />
                    Save Project
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-lg"
                  >
                    <Download className="h-4 w-4 mr-2 opacity-70" />
                    Export
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-lg"
                  >
                    <Upload className="h-4 w-4 mr-2 opacity-70" />
                    Import
                  </Button>
                </div>
              </div>
              <Separator className="bg-zinc-800/50" />
              <div>
                <h3 className="font-medium mb-3 text-sm text-zinc-400 tracking-wide">
                  GAME
                </h3>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-lg"
                  >
                    <Play className="h-4 w-4 mr-2 opacity-70" />
                    Run Game
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-lg"
                  >
                    <Pause className="h-4 w-4 mr-2 opacity-70" />
                    Pause Game
                  </Button>
                </div>
              </div>
              <Separator className="bg-zinc-800/50" />
              <div>
                <h3 className="font-medium mb-3 text-sm text-zinc-400 tracking-wide">
                  HELP
                </h3>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-lg"
                    onClick={() => setShowChat(true)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2 opacity-70" />
                    AI Assistant
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Mobile AI Assistant */}
      {isMobile && <LLMAssistant onClose={() => setShowChat(false)} />}
    </div>
  );
}
