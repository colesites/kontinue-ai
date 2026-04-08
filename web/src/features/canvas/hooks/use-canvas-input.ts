"use client";

import { useState, useRef, useCallback } from "react";
import {
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
  getCanvasModelById,
  isRatioSupported,
  ASPECT_RATIOS,
  VIDEO_DURATIONS,
  isDurationSupported,
} from "../../../lib/canvas-models";

interface UseCanvasInputProps {
  onGenerate: (opts: {
    prompt: string;
    mode: "image" | "video";
    model: string;
    aspectRatio: string;
    resolution?: string;
    duration?: number;
    quality?: "standard" | "pro";
  }) => void;
  isGenerating: boolean;
  credits: { remaining: number; total: number };
  canGenerateImages: boolean;
  canGenerateVideos: boolean;
}

export function useCanvasInput({
  onGenerate,
  isGenerating,
  credits,
  canGenerateImages,
  canGenerateVideos,
}: UseCanvasInputProps) {
  const [mode, setMode] = useState<"image" | "video">("image");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("3:2");
  const [resolution, setResolution] = useState("");
  const [imageModel, setImageModel] = useState(DEFAULT_IMAGE_MODEL);
  const [videoModel, setVideoModel] = useState(DEFAULT_VIDEO_MODEL);
  const [duration, setDuration] = useState(5);
  const [quality, setQuality] = useState<"standard" | "pro">("standard");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeModel = mode === "image" ? imageModel : videoModel;
  const selectedModelData = getCanvasModelById(activeModel);
  const currentProvider = selectedModelData?.provider || "";
  const isFreeModel = selectedModelData?.isFree || false;
  
  const isWan = activeModel.includes("wan");
  const isKling = activeModel.includes("kling");
  const maxChars = isWan ? 500 : isKling ? 2500 : undefined;

  // Auto-reset aspect ratio if not supported by current provider
  const [prevProvider, setPrevProvider] = useState(currentProvider);
  if (currentProvider !== prevProvider) {
    setPrevProvider(currentProvider);
    if (!isRatioSupported(currentProvider, aspectRatio)) {
      const firstSupported = ASPECT_RATIOS.find((r) =>
        isRatioSupported(currentProvider, r.value),
      );
      if (firstSupported) {
        setAspectRatio(firstSupported.value);
      }
    }
  }

  // Auto-reset resolution if model changes
  const [prevModel, setPrevModel] = useState(activeModel);
  if (activeModel !== prevModel) {
    setPrevModel(activeModel);
    if (selectedModelData?.resolutions?.length) {
      setResolution(selectedModelData.resolutions[0].value);
    } else {
      setResolution("");
    }

    // Auto-reset duration if not supported by model
    if (mode === "video" && !isDurationSupported(activeModel, duration)) {
      const supported = VIDEO_DURATIONS.find((d) =>
        isDurationSupported(activeModel, d),
      );
      if (supported) {
        setDuration(supported);
      }
    }
  }

  const calculateCostMultiplier = () => {
    if (isFreeModel) return 0;
    if (isKling) return quality === "pro" ? 20 : 15;
    
    if (resolution.includes("1080")) return 20;
    if (resolution.includes("720")) return 15;
    if (resolution.includes("480")) return 10;
    
    return 15; // Default fallback
  };

  const costMultiplier = calculateCostMultiplier();

  // Auto-correct duration if current choice becomes unaffordable (and not a free model)
  const [prevCreditsRemaining, setPrevCreditsRemaining] = useState(credits.remaining);
  if (credits.remaining !== prevCreditsRemaining) {
    setPrevCreditsRemaining(credits.remaining);
    if (
      !isFreeModel &&
      mode === "video" &&
      duration * costMultiplier > credits.remaining
    ) {
      const affordable = [...VIDEO_DURATIONS]
        .reverse()
        .find((d) => d * costMultiplier <= credits.remaining);
      if (affordable && affordable !== duration) {
        setDuration(affordable);
      }
    }
  }

  const canSubmit =
    !!prompt.trim() &&
    !isGenerating &&
    (isFreeModel || (mode === "image" ? canGenerateImages : canGenerateVideos)) &&
    (!maxChars || prompt.trim().length <= maxChars);

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    onGenerate({
      prompt: prompt.trim(),
      mode,
      model: activeModel,
      aspectRatio,
      resolution: resolution || undefined,
      quality,
      ...(mode === "video" && { duration }),
    });
    setPrompt("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [
    canSubmit,
    onGenerate,
    prompt,
    mode,
    activeModel,
    aspectRatio,
    quality,
    duration,
    resolution,
  ]);

  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  }, []);

  return {
    mode,
    setMode,
    prompt,
    setPrompt,
    handlePromptChange,
    aspectRatio,
    setAspectRatio,
    resolution,
    setResolution,
    imageModel,
    setImageModel,
    videoModel,
    setVideoModel,
    duration,
    setDuration,
    quality,
    setQuality,
    maxChars,
    fileInputRef,
    textareaRef,
    currentProvider,
    activeModel,
    selectedModelData,
    isFreeModel,
    costMultiplier,
    canSubmit,
    handleSubmit,
  };
}
