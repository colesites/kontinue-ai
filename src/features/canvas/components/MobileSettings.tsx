"use client";

import React from "react"; // Added React import for useState
import { VscSettings } from "react-icons/vsc";
import { Ratio, Zap, Clock, ChevronLeft, ChevronRight } from "lucide-react"; // Added ChevronLeft and ChevronRight
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  // DropdownMenuSub, // Removed
  // DropdownMenuSubTrigger, // Removed
  // DropdownMenuSubContent, // Removed
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ASPECT_RATIOS, VIDEO_DURATIONS } from "@/lib/canvas-models";
import { cn } from "@/lib/utils";

interface MobileSettingsProps {
  mode: "image" | "video";
  aspectRatio: string;
  setAspectRatio: (v: string) => void;
  quality: "standard" | "pro";
  setQuality: (v: "standard" | "pro") => void;
  duration: number;
  setDuration: (v: number) => void;
  creditsRemaining: number;
  costMultiplier: number;
  className?: string;
  align?: "start" | "center" | "end";
}

type View = "main" | "aspectRatio" | "quality" | "duration"; // Added View type

export function MobileSettings({
  mode,
  aspectRatio,
  setAspectRatio,
  quality,
  setQuality,
  duration,
  setDuration,
  creditsRemaining,
  costMultiplier,
  className,
  align = "start",
}: MobileSettingsProps) {
  const [view, setView] = React.useState<View>("main"); // Added view state

  // Prevent closing when clicking sub-items by stopping propagation or managing open state
  // But standard menu behavior is fine if we just handle the view state.
  
  const handleOpenChange = (open: boolean) => {
    if (!open) setView("main");
  };

  return (
    <div className={cn("inline-flex shrink-0", className)}>
      <DropdownMenu onOpenChange={handleOpenChange}> {/* Added onOpenChange */}
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-secondary/20 text-foreground/70 transition-all hover:bg-secondary/40 hover:text-foreground focus:outline-none"
            title="Settings"
          >
            <VscSettings className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          sideOffset={12}
          align={align}
          className="z-[100] max-h-[70vh] min-w-[220px] overflow-y-auto border-border/40 bg-background/95 p-0 text-popover-foreground shadow-2xl backdrop-blur-3xl transition-all duration-200" // Modified className
        >
          {view === "main" ? ( // Conditional rendering for main view
            <div className="p-2">
              <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-foreground/40">
                Generation Settings
              </DropdownMenuLabel>
              
              <button
                onClick={(e) => { e.preventDefault(); setView("aspectRatio"); }}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-4 text-sm font-bold transition-all hover:bg-secondary/60 focus:bg-secondary/60"
              >
                <Ratio className="h-4 w-4 text-foreground/40" />
                <span className="flex-1 text-left text-foreground/80 uppercase tracking-wide">Aspect Ratio</span>
                <span className="text-foreground/40 font-black">{aspectRatio}</span>
                <ChevronRight className="h-3.5 w-3.5 text-foreground/20" />
              </button>

              <button
                onClick={(e) => { e.preventDefault(); setView("quality"); }}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-4 text-sm font-bold transition-all hover:bg-secondary/60 focus:bg-secondary/60"
              >
                <Zap className="h-4 w-4 text-foreground/40" />
                <span className="flex-1 text-left text-foreground/80 uppercase tracking-wide">Quality</span>
                <span className="text-foreground/40 font-black">
                  {quality === "standard" ? "STA" : "PRO"}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-foreground/20" />
              </button>

              {mode === "video" && (
                <button
                  onClick={(e) => { e.preventDefault(); setView("duration"); }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-4 text-sm font-bold transition-all hover:bg-secondary/60 focus:bg-secondary/60"
                >
                  <Clock className="h-4 w-4 text-foreground/40" />
                  <span className="flex-1 text-left text-foreground/80 uppercase tracking-wide">Duration</span>
                  <span className="text-foreground/40 font-black">{duration}s</span>
                  <ChevronRight className="h-3.5 w-3.5 text-foreground/20" />
                </button>
              )}
            </div>
          ) : view === "aspectRatio" ? ( // Conditional rendering for aspectRatio view
            <div className="p-2">
              <button
                onClick={() => setView("main")}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80"
              >
                <ChevronLeft className="h-3 w-3" />
                Back to Settings
              </button>
              <DropdownMenuLabel className="px-3 py-3 text-center text-xs font-black uppercase text-foreground/60">
                Select Ratio
              </DropdownMenuLabel>
              {ASPECT_RATIOS.map((r) => (
                <DropdownMenuItem
                  key={r.value}
                  onClick={() => { setAspectRatio(r.value); setView("main"); }} // Set view back to main
                  className="flex cursor-pointer items-center justify-between px-3 py-3 text-sm font-bold"
                >
                  {r.label}
                  {aspectRatio === r.value && (
                    <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          ) : view === "quality" ? ( // Conditional rendering for quality view
            <div className="p-2">
              <button
                onClick={() => setView("main")}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80"
              >
                <ChevronLeft className="h-3 w-3" />
                Back to Settings
              </button>
              <DropdownMenuLabel className="px-3 py-3 text-center text-xs font-black uppercase text-foreground/60">
                Select Quality
              </DropdownMenuLabel>
              {[
                { value: "standard", label: "Standard" },
                { value: "pro", label: "PRO" },
              ].map((q) => (
                <DropdownMenuItem
                  key={q.value}
                  onClick={() => { setQuality(q.value as "standard" | "pro"); setView("main"); }} // Set view back to main
                  className="flex cursor-pointer items-center justify-between px-3 py-3 text-sm font-bold"
                >
                  {q.label}
                  {quality === q.value && (
                    <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          ) : ( // Conditional rendering for duration view (default if not main, aspectRatio, or quality)
            <div className="p-2">
              <button
                onClick={() => setView("main")}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80"
              >
                <ChevronLeft className="h-3 w-3" />
                Back to Settings
              </button>
              <DropdownMenuLabel className="px-3 py-3 text-center text-xs font-black uppercase text-foreground/60">
                Select Duration
              </DropdownMenuLabel>
              {VIDEO_DURATIONS.filter(
                (d) => d * costMultiplier <= creditsRemaining
              ).map((d) => (
                <DropdownMenuItem
                  key={d}
                  onClick={() => { setDuration(d); setView("main"); }} // Set view back to main
                  className="flex cursor-pointer items-center justify-between px-3 py-3 text-sm font-bold"
                >
                  {d}s
                  {duration === d && (
                    <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
