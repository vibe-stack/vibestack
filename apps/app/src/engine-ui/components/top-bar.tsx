import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings, Code, ImageIcon } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { motion } from "motion/react";

export type EngineUIMode = "dev" | "asset-studio";

export default function TopBar({ mode, onModeChange }: { mode: EngineUIMode; onModeChange: (mode: EngineUIMode) => void }) {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (dialogOpen) {
      fetch("/api/settings/anthropic-api-key")
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => setApiKey(data.apiKey || ""))
        .catch(() => setApiKey(""));
    }
  }, [dialogOpen]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/settings/anthropic-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      if (!res.ok) throw new Error("Failed to save API key");
      setSuccess(true);
    } catch {
      setError("Failed to save API key");
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="px-4 py-1 flex items-center justify-between bg-zinc-900/60 backdrop-blur-md border-b border-green-900/10 shadow-[0_2px_16px_0_rgba(16,255,120,0.03)]">
      <Link href="/" className="flex items-center gap-2 min-w-0">
        <Image src="/logo.png" alt="GGEZ" width={32} height={32} className="rounded-full overflow-hidden" />
        <h1 className="font-semibold text-base tracking-tight truncate">GGEZ</h1>
      </Link>
      <div className="flex-1 flex justify-center">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            aria-label="Toggle mode"
            className="group w-28 h-10 bg-zinc-800/80 rounded-full flex items-center px-1 shadow-inner border border-zinc-700/40 focus:outline-none focus:ring-2 focus:ring-green-400/60 transition-colors"
            onClick={() => onModeChange(mode === "dev" ? "asset-studio" : "dev")}
            tabIndex={0}
          >
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={`absolute top-1 left-1 w-12 h-8 rounded-full z-0 bg-gradient-to-br from-green-400/80 to-green-700/80 shadow-lg ${mode === "asset-studio" ? "translate-x-16" : "translate-x-0"}`}
              style={{ x: mode === "asset-studio" ? -8 : 0 }}
            />
            <span className="relative z-10 flex items-center justify-between w-full h-full px-2">
              <span className={`flex items-center gap-1 transition-colors duration-300 ${mode === "dev" ? "text-zinc-900 font-bold" : "text-zinc-400"}`}>
                <Code className="h-5 w-5 mx-1" />
              </span>
              <span className={`flex items-center gap-1 transition-colors duration-300 ${mode === "asset-studio" ? "text-zinc-900 font-bold" : "text-zinc-400"}`}>
                <ImageIcon className="h-5 w-5 mx-1" />
              </span>
            </span>
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="rounded-lg">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Anthropic API Key</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <Input
                type="text"
                placeholder="Enter your Anthropic API key"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                required
                autoFocus
              />
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
              {success && <span className="text-green-600 text-xs">API key saved!</span>}
              {error && <span className="text-red-600 text-xs">{error}</span>}
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
} 