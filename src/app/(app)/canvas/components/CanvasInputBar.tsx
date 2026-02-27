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
import { ModeButton, PillButton, Divider } from "./InputPills";
import { PillSelect } from "./PillSelect";

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


  // Auto-correct duration if current choice becomes unaffordable
  // We do this during render to avoid cascading renders (useEffect -> setState)
  if (mode === "video" && duration * 20 > credits.remaining) {
    const affordable = [...VIDEO_DURATIONS]
      .reverse()
      .find((d) => d * 20 <= credits.remaining);
    if (affordable && affordable !== duration) {
      setDuration(affordable);
    }
  }

  const activeModel = mode === "image" ? imageModel : videoModel;
  const models = mode === "image" ? IMAGE_MODELS : VIDEO_MODELS;
  const canSubmit = prompt.trim() && !isGenerating && (mode === "image" ? canGenerateImages : canGenerateVideos);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onGenerate({ prompt: prompt.trim(), mode, model: activeModel, aspectRatio, ...(mode === "video" && { duration, quality }) });
    setPrompt("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const sidebarOffset = !sidebarMobile && sidebarState === "expanded" ? "var(--sidebar-width)" : "0px";

  return (
    <TooltipProvider delayDuration={200}>
      <div className="pointer-events-none fixed bottom-0 z-50 px-4 pb-4 transition-[left,width] duration-300" style={{ left: sidebarOffset, width: `calc(100vw - ${sidebarOffset})` }}>
        <div className="pointer-events-auto relative mx-auto w-full max-w-3xl">
          <div className="overflow-hidden rounded-3xl border border-border/40 bg-secondary/20 shadow-2xl backdrop-blur-3xl transition-colors">
            <div className="flex items-end gap-3 px-5 pt-4 pb-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => fileInputRef.current?.click()} className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/40 text-foreground/60 transition-colors hover:bg-secondary hover:text-foreground">
                    <Paperclip className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-popover text-popover-foreground border-border"><p className="text-xs font-bold uppercase tracking-wider">Attach image</p></TooltipContent>
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
                className="min-w-0 flex-1 resize-none bg-transparent py-2 text-base font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none scrollbar-hide max-h-40"
                disabled={isGenerating}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={handleSubmit} disabled={!canSubmit} className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-all hover:scale-105 disabled:opacity-50">
                    {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-6 w-6" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-popover text-popover-foreground border-border"><p className="text-xs font-bold uppercase tracking-wider">Generate</p></TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto px-4 pb-4 pt-1 scrollbar-hide">
              <ModeButton active={mode === "image"} disabled={!canGenerateImages} tooltip={!canGenerateImages ? "Upgrade to generate images" : "Image Mode"} onClick={() => setMode("image")} icon={<ImageIcon className="h-4 w-4" />}>Image</ModeButton>
              <ModeButton active={mode === "video"} disabled={!canGenerateVideos} tooltip={!canGenerateVideos ? "Upgrade to generate videos" : "Video Mode"} onClick={() => setMode("video")} icon={<Video className="h-4 w-4" />}>Video</ModeButton>
              <Divider />
              <PillSelect value={aspectRatio} onChange={setAspectRatio} icon={<Ratio className="h-4 w-4" />} tooltip="Aspect Ratio" options={ASPECT_RATIOS.map(r => ({ value: r.value, label: r.label }))} />
              {mode === "video" && (
                <>
                  <PillSelect 
                    value={String(duration)} 
                    onChange={(v) => setDuration(Number(v))} 
                    icon={<Clock className="h-4 w-4" />} 
                    tooltip="Duration" 
                    label={`${duration}s`} 
                    options={VIDEO_DURATIONS
                      .filter(d => d * 20 <= credits.remaining)
                      .map(d => ({ value: String(d), label: `${d}s` }))
                    } 
                  />
                  <PillButton active={quality === "pro"} onClick={() => setQuality(q => q === "pro" ? "standard" : "pro")} icon={<Zap className="h-4 w-4" />} tooltip="Quality">{quality === "pro" ? "Pro" : "Std"}</PillButton>
                </>
              )}
              <Divider />
              <PillSelect value={activeModel} onChange={(v) => mode === "image" ? setImageModel(v) : setVideoModel(v)} tooltip="AI Model" options={models.map(m => ({ value: m.id, label: m.name }))} />
              <div className="flex-1" />
              {isPro && mode === "video" && (
                <div className="shrink-0 flex flex-col items-end leading-none pr-1">
                  <span className="text-[10px] font-black text-foreground/40 uppercase tracking-tighter">Credits</span>
                  <span className="text-[11px] font-bold text-foreground/80">{credits.remaining}/{credits.total}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
