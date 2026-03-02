"use client";

import { Plus, Search } from "lucide-react";
import { cn } from "@/utils/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/ModeToggle";
import Link from "next/link";

interface CanvasHeaderProps {
  tab: "community" | "mine";
  setTab: (tab: "community" | "mine") => void;
}

export function CanvasHeader({ tab, setTab }: CanvasHeaderProps) {
  const toolbarButtonClasses =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground/85 transition-colors hover:text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

  return (
    <header className="sticky top-0 z-40 bg-background/80 text-foreground backdrop-blur-xl border-b border-border/40">
      <div className="flex items-center justify-between px-3 md:px-4 h-16">
        <div className="flex items-center gap-3 md:gap-8 overflow-hidden">
          <div className="flex items-center gap-1">
            <SidebarTrigger className={toolbarButtonClasses} />
            <button
              type="button"
              className={toolbarButtonClasses}
              aria-label="Search chats"
            >
              <Search className="size-4" />
            </button>
            <Link
              href="/"
              className={toolbarButtonClasses}
              aria-label="Start new chat"
            >
              <Plus className="size-4" />
            </Link>
            <div className="flex items-center shrink-0 ml-2">
              <h1 className="text-sm font-bold tracking-wider uppercase text-foreground/80 hidden xs:block">
                Canvas
              </h1>
            </div>
          </div>

          {/* Desktop Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border/40">
            <button
              type="button"
              onClick={() => setTab("community")}
              className={cn(
                "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all",
                tab === "community"
                  ? "bg-background text-foreground shadow-lg border border-border/20"
                  : "text-muted-foreground hover:text-foreground",
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
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              My Creations
            </button>
          </nav>

          {/* Mobile Dropdown */}
          <div className="md:hidden flex items-center min-w-0">
            <Select
              value={tab}
              onValueChange={(value) => setTab(value as "community" | "mine")}
            >
              <SelectTrigger
                size="sm"
                className="bg-muted/30 border-border/40 h-8 text-xs font-semibold px-3"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="mine">My Creations</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
