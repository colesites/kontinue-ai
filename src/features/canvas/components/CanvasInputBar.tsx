"use client";

import { useState, useRef } from "react";
import {
  Image as ImageIcon,
  Video,
  Ratio,
  Clock,
  Zap,
  Paperclip,
  ArrowUp,
  Loader2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  IMAGE_MODELS,
  VIDEO_MODELS,
  ASPECT_RATIOS,
  VIDEO_DURATIONS,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
} from "@/lib/canvas-models";
import { useSidebar } from "@/components/ui/sidebar";
import { Divider } from "./InputPills";
import { PillSelect } from "./PillSelect";
import { cn } from "@/utils/cn";

interface CanvasInputBarProps {
  onGenerate: (opts: {
    prompt: string;
    mode: "image" | "video";
    model: string;
    aspectRatio: string;
    duration?: number;
    quality?: "standard" | "pro";
  }) => void;
  isGenerating: boolean;
  credits: { remaining: number; total: number };
  canGenerateImages: boolean;
  canGenerateVideos: boolean;
  isPro: boolean;
}

export function CanvasInputBar({
  onGenerate,
  isGenerating,
  credits,
  canGenerateImages,
  canGenerateVideos,
  isPro,
}: CanvasInputBarProps) {
  const { state: sidebarState, isMobile: sidebarMobile } = useSidebar();
  const [mode, setMode] = useState<"image" | "video">("image");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("3:2");
  const [imageModel, setImageModel] = useState(DEFAULT_IMAGE_MODEL);
  const [videoModel, setVideoModel] = useState(DEFAULT_VIDEO_MODEL);
  const [duration, setDuration] = useState(5);
  const [quality, setQuality] = useState<"standard" | "pro">("standard");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const costMultiplier = quality === "pro" ? 20 : 15;

  // Auto-correct duration if current choice becomes unaffordable
  if (mode === "video" && duration * costMultiplier > credits.remaining) {
    const affordable = [...VIDEO_DURATIONS]
      .reverse()
      .find((d) => d * costMultiplier <= credits.remaining);
    if (affordable && affordable !== duration) {
      setDuration(affordable);
    }
  }

  const activeModel = mode === "image" ? imageModel : videoModel;
  const models = mode === "image" ? IMAGE_MODELS : VIDEO_MODELS;
  const canSubmit = prompt.trim() && !isGenerating && (mode === "image" ? canGenerateImages : canGenerateVideos);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onGenerate({ 
      prompt: prompt.trim(), 
      mode, 
      model: activeModel, 
      aspectRatio, 
      quality,
      ...(mode === "video" && { duration }) 
    });
    setPrompt("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const sidebarOffset = !sidebarMobile && sidebarState === "expanded" ? "var(--sidebar-width)" : "0px";

  return (
    <TooltipProvider delayDuration={200}>
      <div 
        className="pointer-events-none fixed bottom-0 z-50 px-4 pb-6 transition-[left,width] duration-300 sm:pb-8" 
        style={{ left: sidebarOffset, width: sidebarMobile ? "100vw" : `calc(100vw - ${sidebarOffset})` }}
      >
        <div className="pointer-events-auto relative mx-auto w-full max-w-3xl">
          <div className="overflow-hidden rounded-[2rem] border border-border/40 bg-zinc-900/80 shadow-2xl backdrop-blur-3xl transition-colors sm:rounded-[2.5rem]">
            <div className="flex items-end gap-3 px-6 pt-5 pb-2 sm:px-8">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-foreground/40 transition-colors hover:bg-secondary/40 hover:text-foreground"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-popover text-popover-foreground border-border"><p className="text-[10px] font-bold uppercase tracking-wider">Attach image</p></TooltipContent>
              </Tooltip>
              
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={() => {}} />
              
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                rows={1}
                placeholder={mode === "image" ? "What do you want to create?" : "Describe your video..."}
                className="min-w-0 flex-1 resize-none bg-transparent py-3 text-base font-semibold text-foreground placeholder:text-muted-foreground/30 focus:outline-none scrollbar-hide max-h-40"
                disabled={isGenerating}
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={handleSubmit} 
                    disabled={!canSubmit} 
                    className={cn(
                      "mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                      canSubmit 
                        ? "bg-foreground text-background hover:scale-105 active:scale-95" 
                        : "bg-secondary/20 text-foreground/20 cursor-not-allowed"
                    )}
                  >
                    {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-6 w-6" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-popover text-popover-foreground border-border"><p className="text-[10px] font-bold uppercase tracking-wider">Generate</p></TooltipContent>
              </Tooltip>
            </div>

            <div className="flex flex-wrap items-center gap-2 px-6 pb-5 pt-1 sm:px-8">
              <PillSelect 
                value={mode} 
                onChange={(v) => setMode(v as "image" | "video")} 
                header="Type"
                tooltip="Select generation type"
                options={[
                  { value: "image", label: "Image", icon: <ImageIcon className="h-3.5 w-3.5" /> },
                  { value: "video", label: "Video", icon: <Video className="h-3.5 w-3.5" /> }
                ]} 
              />

              <PillSelect 
                value={aspectRatio} 
                onChange={setAspectRatio} 
                icon={<Ratio className="h-3.5 w-3.5" />} 
                tooltip="Aspect Ratio" 
                options={ASPECT_RATIOS.map(r => ({ value: r.value, label: r.label }))} 
              />

              <PillSelect 
                value={quality} 
                onChange={(v) => setQuality(v as "standard" | "pro")} 
                tooltip="Quality" 
                label={quality.charAt(0).toUpperCase() + quality.slice(1)}
                options={[
                  { value: "standard", label: "Standard" },
                  { value: "pro", label: "Pro" }
                ]} 
                icon={<Zap className="h-3.5 w-3.5" />}
              />

              {mode === "video" && (
                <>
                  <Divider />
                  <PillSelect 
                    value={String(duration)} 
                    onChange={(v) => setDuration(Number(v))} 
                    icon={<Clock className="h-3.5 w-3.5" />} 
                    tooltip="Duration" 
                    label={`${duration}s`} 
                    options={VIDEO_DURATIONS
                      .filter(d => d * costMultiplier <= credits.remaining)
                      .map(d => ({ value: String(d), label: `${d}s` }))
                    } 
                  />
                </>
              )}

              <div className="hidden flex-1 sm:block" />
              
              <Divider className="sm:hidden" />

              <PillSelect 
                value={activeModel} 
                onChange={(v) => mode === "image" ? setImageModel(v) : setVideoModel(v)} 
                tooltip="AI Model" 
                options={models.map(m => ({ value: m.id, label: m.name }))} 
              />

              {isPro && mode === "video" && (
                <div className="ml-auto shrink-0 flex flex-col items-end leading-none pr-1">
                  <span className="text-[10px] font-black text-foreground/20 uppercase tracking-tighter">Credits</span>
                  <span className="text-[11px] font-bold text-foreground/40">{credits.remaining}/{credits.total}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
