import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

export default function TopBar() {
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
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.png" alt="GGEZ" width={32} height={32} className="rounded-full overflow-hidden" />
        <h1 className="font-semibold text-base tracking-tight">GGEZ</h1>
      </Link>
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
    </header>
  );
} 