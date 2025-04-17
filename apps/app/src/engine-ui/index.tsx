"use client";

import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSceneHierarchyStore } from "@/store/scene-hierarchy-store";
import TopBar, { EngineUIMode } from "./components/top-bar";
import DevModeView from "./views/dev-mode-view";
import AssetStudioView from "./views/asset-studio-view";

export default function EngineUI() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("preview");
  const [mode, setMode] = useState<EngineUIMode>("dev");
  const { selectedNodeId, setSelectedNode } = useSceneHierarchyStore();
  const handleSelectNode = (nodeId: string) => setSelectedNode(nodeId);

  return (
    <div className="flex flex-col h-screen text-zinc-200 bg-gradient-to-br from-zinc-950 via-green-950/20 to-zinc-900/90 relative overflow-hidden">
      <div className='pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(16,255,120,0.012)_0%,rgba(0,0,0,0)_20%)] blur-3xl'></div>
      <TopBar mode={mode} onModeChange={setMode} />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {mode === "dev" ? (
          <DevModeView
            isMobile={isMobile}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedNodeId={selectedNodeId}
            handleSelectNode={handleSelectNode}
          />
        ) : (
          <AssetStudioView />
        )}
      </div>
    </div>
  );
}
