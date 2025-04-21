import { Button } from "@/components/ui/button";
import { memo } from "react";
import type { Mode } from "./types";

const ModeButton = memo(
  ({
    mode,
    currentMode,
    icon: Icon,
    label,
    onClick,
  }: {
    mode: Mode;
    currentMode: Mode;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
  }) => (
    <Button
      variant={mode === currentMode ? "default" : "outline"}
      size="sm"
      className="h-6 px-2 py-1 text-xs"
      onClick={onClick}
    >
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Button>
  )
);

ModeButton.displayName = "ModeButton";

export default ModeButton; 