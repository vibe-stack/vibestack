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
      className="h-8"
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5 mr-1" />
      {label}
    </Button>
  )
);

ModeButton.displayName = "ModeButton";

export default ModeButton; 