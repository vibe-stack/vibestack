import AssetsPanel from "../components/assets-panel";
import ThreeDEditor from "../components/three-editor";

export default function AssetStudioView() {
  return (
    <div className="flex h-full w-full">
      <div className="w-72 min-w-60 max-w-xs h-full bg-zinc-900/40 border-r border-green-900/10">
        <AssetsPanel />
      </div>
      <div className="flex-1 h-full">
        <ThreeDEditor />
      </div>
    </div>
  );
} 