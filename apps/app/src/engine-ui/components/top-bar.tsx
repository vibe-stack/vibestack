import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TopBar() {
  return (
    <header className="px-4 py-1 flex items-center justify-between bg-zinc-900/70 backdrop-blur-sm border-b border-zinc-800">
      <Link href="/">
        <h1 className="font-semibold text-base tracking-tight">GGEZ</h1>
      </Link>
      <div className="relative flex items-center">
        <Button variant="ghost" size="sm" className="rounded-lg" disabled>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Badge className="absolute -top-2 -right-2 bg-zinc-700 text-zinc-300 px-1.5 py-0.5 text-[10px] font-semibold" variant="secondary">soon</Badge>
      </div>
    </header>
  );
} 