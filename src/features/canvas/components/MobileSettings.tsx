"use client";

import React from "react";
import { VscSettings } from "react-icons/vsc";
import { Zap, Clock, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
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

const RatioIcon = ({
  ratio,
  className,
}: {
  ratio: string;
  className?: string;
}) => (
  <div className="flex h-5 w-5 items-center justify-center">
    <div
      className={cn(
        "rounded-[2px] border border-current opacity-60",
        ratio === "1:1" && "h-3 w-3",
        ratio === "16:9" && "h-2 w-[14px]",
        ratio === "9:16" && "h-[14px] w-2",
        ratio === "3:2" && "h-[10px] w-[15px]",
        ratio === "4:3" && "h-[11px] w-[14px]",
        className,
      )}
    />
  </div>
);

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
  const dropdownContentClasses =
    "z-[100] min-w-[220px] rounded-[2rem] border border-white/10 bg-[#121212]/95 p-2 text-popover-foreground shadow-2xl backdrop-blur-3xl transition-all duration-200";
  const itemClasses =
    "flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all hover:bg-white/10 focus:bg-white/10 data-[state=open]:bg-white/10";
  const subContentClasses =
    "z-[110] min-w-[180px] rounded-[2rem] border border-white/10 bg-[#121212]/95 p-2 text-popover-foreground shadow-2xl backdrop-blur-3xl";

  return (
    <div className={cn("inline-flex shrink-0", className)}>
      <DropdownMenu>
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
          className={dropdownContentClasses}
        >
          <div className="space-y-1">
            <DropdownMenuLabel className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-widest text-white/30">
              Generation Settings
            </DropdownMenuLabel>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className={itemClasses}>
                <RatioIcon ratio={aspectRatio} className="text-white/40" />
                <span className="flex-1 text-left text-white/80 uppercase tracking-wide ml-1">
                  Aspect ratio
                </span>
                <span className="text-white/40 font-black">{aspectRatio}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                className={subContentClasses}
                sideOffset={8}
              >
                <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/30">
                  Aspect ratio
                </DropdownMenuLabel>
                {ASPECT_RATIOS.map((r) => (
                  <DropdownMenuItem
                    key={r.value}
                    onClick={() => setAspectRatio(r.value)}
                    className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-white/80 transition-all hover:bg-white/10 focus:bg-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <RatioIcon ratio={r.value} className="text-white/80" />
                      {r.label}
                    </div>
                    {aspectRatio === r.value && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className={itemClasses}>
                <Zap className="h-4 w-4 text-white/40" />
                <span className="flex-1 text-left text-white/80 uppercase tracking-wide">
                  Quality
                </span>
                <span className="text-white/40 font-black">
                  {quality === "standard" ? "STA" : "PRO"}
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                className={subContentClasses}
                sideOffset={8}
              >
                <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/30">
                  Quality
                </DropdownMenuLabel>
                {[
                  { value: "standard", label: "Standard" },
                  { value: "pro", label: "PRO" },
                ].map((q) => (
                  <DropdownMenuItem
                    key={q.value}
                    onClick={() => setQuality(q.value as "standard" | "pro")}
                    className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-white/80 transition-all hover:bg-white/10 focus:bg-white/10"
                  >
                    {q.label}
                    {quality === q.value && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {mode === "video" && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className={itemClasses}>
                  <Clock className="h-4 w-4 text-white/40" />
                  <span className="flex-1 text-left text-white/80 uppercase tracking-wide">
                    Duration
                  </span>
                  <span className="text-white/40 font-black">{duration}s</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  className={subContentClasses}
                  sideOffset={8}
                >
                  <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/30">
                    Duration
                  </DropdownMenuLabel>
                  {VIDEO_DURATIONS.filter(
                    (d) => d * costMultiplier <= creditsRemaining,
                  ).map((d) => (
                    <DropdownMenuItem
                      key={d}
                      onClick={() => setDuration(d)}
                      className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-white/80 transition-all hover:bg-white/10 focus:bg-white/10"
                    >
                      {d}s
                      {duration === d && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
