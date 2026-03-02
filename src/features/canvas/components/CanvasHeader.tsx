"use client";

import { Layout } from "lucide-react";
import { cn } from "@/utils/cn";

interface CanvasHeaderProps {
  tab: "community" | "mine";
  setTab: (tab: "community" | "mine") => void;
}

export function CanvasHeader({ tab, setTab }: CanvasHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/80 text-foreground backdrop-blur-xl border-b border-border/40">
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary shadow-inner border border-border/20">
              <Layout className="h-4 w-4 text-foreground/70" />
            </div>
            <h1 className="text-sm font-bold tracking-wider uppercase text-foreground/80">
              Canvas
            </h1>
          </div>

          <nav className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border/40">
            <button
              type="button"
              onClick={() => setTab("community")}
              className={cn(
                "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all",
                tab === "community"
                  ? "bg-background text-foreground shadow-lg border border-border/20"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Community
            </button>
            <button
              type="button"
              onClick={() => setTab("mine")}
              className={cn(
                "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all",
                tab === "mine"
                  ? "bg-background text-foreground shadow-lg border border-border/20"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              My Creations
            </button>
          </nav>
        </div>

        {/* Right side left empty to let AppShell floating controls show through/on top */}
        <div className="flex items-center w-[120px]" />
      </div>
    </header>
  );
}
