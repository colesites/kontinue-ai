"use client";

import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  PromptInputProvider,
} from "@/components/ai-elements/prompt-input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckIcon, ImageIcon, X } from "lucide-react";
import { CiGlobe } from "react-icons/ci";
import { FaPaperclip } from "react-icons/fa";
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { validateFile } from "@/lib/file-upload";
import { AVAILABLE_MODELS } from "@/lib/models";
import { useModelCapabilities } from "@/lib/use-model-capabilities";
import { ModelCapabilityIcons } from "@/components/ai-elements/model-capability-icons";
import { useIsProPlan } from "@/lib/use-is-pro-plan";
import { PremiumModelBadge } from "@/components/ai-elements/premium-model-badge";
import type { ChatInputProps } from "@/features/chat/types";

function AttachmentPreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const fileExt = file.name.split(".").pop()?.toUpperCase() ?? "";
  const isImage =
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|bmp|svg|heic|heif)$/i.test(file.name);
  const isVideo = file.type.startsWith("video/");
  const isAudio = file.type.startsWith("audio/");
  const isPdf =
    file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  const isText =
    file.type.startsWith("text/") ||
    [
      "application/json",
      "application/xml",
      "application/x-yaml",
      "text/xml",
    ].includes(file.type) ||
    /\.(txt|md|markdown|csv|json|xml|yml|yaml|log|ini|conf|env|toml)$/i.test(
      file.name,
    );
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [textPreview, setTextPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isImage && !isVideo && !isAudio && !isPdf && !isText) {
      setObjectUrl(null);
      setImageError(false);
      setTextPreview(null);
      return;
    }

    try {
      if (isImage || isVideo || isAudio || isPdf) {
        const url = URL.createObjectURL(file);
        setObjectUrl(url);
        setImageError(false);
        return () => URL.revokeObjectURL(url);
      }
    } catch {
      setObjectUrl(null);
      setImageError(true);
    }
  }, [file, isImage, isVideo, isAudio, isPdf, isText]);

  useEffect(() => {
    if (!isText) {
      setTextPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setTextPreview(text.slice(0, 800));
    };
    reader.onerror = () => setTextPreview(null);
    reader.readAsText(file.slice(0, 2000));
  }, [file, isText]);

  return (
    <div className="group relative flex min-w-[240px] max-w-[360px] items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-2.5 pr-9 shadow-sm">
      {isImage && objectUrl && !imageError ? (
        <img
          src={objectUrl}
          alt={file.name}
          className="h-16 w-16 rounded-lg border border-border/60 object-cover"
          onError={() => setImageError(true)}
        />
      ) : isVideo && objectUrl && !imageError ? (
        <video
          src={objectUrl}
          className="h-16 w-16 rounded-lg border border-border/60 object-cover"
          muted
          playsInline
          preload="metadata"
          onError={() => setImageError(true)}
        />
      ) : isPdf && objectUrl && !imageError ? (
        <embed
          src={objectUrl}
          type="application/pdf"
          className="h-20 w-16 rounded-lg border border-border/60 bg-background/80"
          onError={() => setImageError(true)}
        />
      ) : isText ? (
        <div className="flex h-20 w-16 items-center justify-center rounded-lg border border-border/60 bg-background/80 text-muted-foreground">
          <span className="text-[10px] font-semibold tracking-wide text-muted-foreground/80">
            TEXT
          </span>
        </div>
      ) : isAudio && objectUrl && !imageError ? (
        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border border-border/60 bg-background/80 text-muted-foreground">
          <ImageIcon className="h-5 w-5" />
          <span className="mt-1 text-[10px] font-semibold tracking-wide text-muted-foreground/80">
            AUDIO
          </span>
        </div>
      ) : (
        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border border-border/60 bg-background/80 text-muted-foreground">
          <ImageIcon className="h-5 w-5" />
          <span className="mt-1 text-[10px] font-semibold tracking-wide text-muted-foreground/80">
            {fileExt || "FILE"}
          </span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">
          {file.name}
        </div>
        <div className="text-xs text-muted-foreground">
          {(file.size / 1024).toFixed(1)}KB
        </div>
        {isText && textPreview && (
          <div className="mt-2 line-clamp-3 whitespace-pre-wrap rounded-md border border-border/60 bg-background/70 px-2 py-1 text-[11px] leading-snug text-muted-foreground">
            {textPreview}
          </div>
        )}
        {isAudio && objectUrl && !imageError && (
          <audio
            src={objectUrl}
            controls
            preload="metadata"
            className="mt-2 h-8 w-full"
            onError={() => setImageError(true)}
          />
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        title="Remove file"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

const IMAGE_ASPECT_OPTIONS: { value: string; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "1:1", label: "1:1" },
  { value: "7:3", label: "7:3" },
  { value: "4:1", label: "4:1" },
  { value: "21:9", label: "21:9" },
  { value: "16:9", label: "16:9" },
  { value: "5:3", label: "5:3" },
  { value: "5:4", label: "5:4" },
  { value: "4:3", label: "4:3" },
  { value: "3:2", label: "3:2" },
  { value: "9:7", label: "9:7" },
  { value: "9:16", label: "9:16" },
  { value: "4:5", label: "4:5" },
  { value: "2:3", label: "2:3" },
  { value: "3:4", label: "3:4" },
  { value: "1:2", label: "1:2" },
  { value: "1:4", label: "1:4" },
  { value: "1:9", label: "1:9" },
  { value: "3:7", label: "3:7" },
  { value: "9:21", label: "9:21" },
];

const IMAGE_SIZE_OPTIONS: { value: string; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "256x256", label: "256×256" },
  { value: "512x512", label: "512×512" },
  { value: "768x768", label: "768×768" },
  { value: "1024x768", label: "1024×768" },
  { value: "1024x1024", label: "1024×1024" },
  { value: "1536x1024", label: "1536×1024" },
  { value: "1024x1536", label: "1024×1536" },
  { value: "1792x1024", label: "1792×1024" },
  { value: "1024x1792", label: "1024×1792" },
  { value: "1365x1024", label: "1365×1024" },
  { value: "1024x1365", label: "1024×1365" },
  { value: "1820x1024", label: "1820×1024" },
  { value: "1024x1820", label: "1024×1820" },
  { value: "2048x1024", label: "2048×1024" },
  { value: "1024x2048", label: "1024×2048" },
  { value: "1707x1024", label: "1707×1024" },
  { value: "1024x1707", label: "1024×1707" },
  { value: "1434x1024", label: "1434×1024" },
  { value: "1024x1434", label: "1024×1434" },
  { value: "1280x1024", label: "1280×1024" },
  { value: "1024x1280", label: "1024×1280" },
  { value: "640x1536", label: "640×1536" },
  { value: "768x1344", label: "768×1344" },
  { value: "832x1216", label: "832×1216" },
  { value: "896x1152", label: "896×1152" },
  { value: "1152x896", label: "1152×896" },
  { value: "1216x832", label: "1216×832" },
  { value: "1344x768", label: "1344×768" },
  { value: "1536x640", label: "1536×640" },
];

const IMAGE_ASPECT_VALUES = new Set(IMAGE_ASPECT_OPTIONS.map((o) => o.value));
const IMAGE_SIZE_VALUES = new Set(
  IMAGE_SIZE_OPTIONS.map((o) => o.value).filter((v) => v !== "default"),
);
const OPENAI_SUPPORTED_SIZES = new Set(["1024x1024", "1536x1024", "1024x1536"]);
const OPENAI_SUPPORTED_ASPECTS = new Set([
  "auto",
  "1:1",
  "21:9",
  "16:9",
  "5:4",
  "4:3",
  "3:2",
  "9:16",
  "4:5",
  "2:3",
  "3:4",
  "9:21",
  "1:9",
  "7:3",
  "3:7",
]);
const GOOGLE_SUPPORTED_ASPECTS = new Set(["auto", "1:1", "3:4", "4:3", "9:16", "16:9"]);

function getSupportedImageOptions(modelId?: string) {
  if (!modelId) {
    return {
      aspectRatios: new Set<string>(["auto"]),
      sizes: new Set<string>([]),
    };
  }

  // OpenAI image_generation tool options (AI SDK OpenAI tool contract).
  if (modelId.startsWith("openai/")) {
    return {
      aspectRatios: OPENAI_SUPPORTED_ASPECTS,
      sizes: OPENAI_SUPPORTED_SIZES,
    };
  }

  // Google Gemini/Imagen image generation ratios via AI SDK.
  if (modelId.startsWith("google/")) {
    return {
      aspectRatios: GOOGLE_SUPPORTED_ASPECTS,
      sizes: new Set<string>([]),
    };
  }

  return {
    aspectRatios: new Set<string>(["auto"]),
    sizes: new Set<string>([]),
  };
}

export function ChatInput({
  onSend,
  isLoading,
  disabled,
  onStop,
  model,
  onModelChange,
  webSearchEnabled = false,
  onWebSearchToggle,
  imageAspectRatio = "auto",
  imageSize = null,
  onImageAspectRatioChange,
  onImageSizeChange,
}: ChatInputProps & {
  webSearchEnabled?: boolean;
  onWebSearchToggle?: () => void;
  imageAspectRatio?: string;
  imageSize?: string | null;
  onImageAspectRatioChange?: (value: string) => void;
  onImageSizeChange?: (value: string | null) => void;
}) {
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getCapabilities, isPremium } = useModelCapabilities();
  const isPro = useIsProPlan();

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    onSend(inputValue, attachedFiles.length > 0 ? attachedFiles : undefined);
    setInputValue("");
    setAttachedFiles([]);
  };

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const validFiles: File[] = [];
      let rejectedCount = 0;
      for (const file of files) {
        const error = validateFile(file);
        if (error) {
          rejectedCount += 1;
          toast.error(`${file.name}: ${error}`);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        setAttachedFiles((prev) => [...prev, ...validFiles]);
      }
      if (rejectedCount > 0 && validFiles.length === 0) {
        toast.error("No files were attached.");
      }

      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [],
  );

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeFile = useCallback((index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Group models by provider for the selector
  const groupedModels = AVAILABLE_MODELS.reduce(
    (acc, m) => {
      if (!acc[m.provider]) acc[m.provider] = [];
      acc[m.provider].push(m);
      return acc;
    },
    {} as Record<string, typeof AVAILABLE_MODELS>,
  );

  const selectedModelData = AVAILABLE_MODELS.find((m) => m.id === model);
  const canSearch =
    !!selectedModelData &&
    getCapabilities(selectedModelData.id).includes("web-search");
  const canGenerateImage =
    !!selectedModelData &&
    getCapabilities(selectedModelData.id).includes("image-generation");
  const supportedImageOptions =
    selectedModelData && canGenerateImage
      ? getSupportedImageOptions(selectedModelData.id)
      : getSupportedImageOptions(undefined);
  const supportedAspectRatios = supportedImageOptions.aspectRatios;
  const supportedSizes = supportedImageOptions.sizes;

  return (
    <div className="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-lg supports-backdrop-filter:bg-background/70 backdrop-blur">
      <PromptInputProvider>
        <PromptInput
          onSubmit={handleSubmit}
          isLoading={isLoading}
          disabled={disabled}
          value={inputValue}
          onValueChange={setInputValue}
        >
          <PromptInputBody>
            <PromptInputTextarea ref={textareaRef} />
            {attachedFiles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3 px-1">
                {attachedFiles.map((file, index) => (
                  <AttachmentPreview
                    key={`${file.name}-${index}`}
                    file={file}
                    onRemove={() => removeFile(index)}
                  />
                ))}
              </div>
            )}
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <ModelSelector
                open={modelSelectorOpen}
                onOpenChange={setModelSelectorOpen}
              >
                <ModelSelectorTrigger asChild>
                  <PromptInputButton>
                    {selectedModelData && (
                      <>
                        <ModelSelectorLogo
                          provider={selectedModelData.provider}
                        />
                        <ModelSelectorName>
                          {selectedModelData.name}
                        </ModelSelectorName>
                        {isPremium(selectedModelData.id) && (
                          <PremiumModelBadge className="ml-1" />
                        )}
                        <ModelCapabilityIcons
                          className="ml-1"
                          capabilities={getCapabilities(selectedModelData.id)}
                        />
                      </>
                    )}
                  </PromptInputButton>
                </ModelSelectorTrigger>
                <ModelSelectorContent>
                  <ModelSelectorInput placeholder="Search models..." />
                  <ModelSelectorList>
                    <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                    {Object.entries(groupedModels).map(([provider, models]) => (
                      <ModelSelectorGroup key={provider}>
                        <div className="px-2 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {provider}
                        </div>
                        {models.map((m) =>
                          (() => {
                            const premium = isPremium(m.id);
                            const disabledByPlan = premium && !isPro;

                            return (
                              <ModelSelectorItem
                                key={m.id}
                                disabled={disabledByPlan}
                                onSelect={() => {
                                  if (disabledByPlan) return;
                                  onModelChange(m.id);
                                  setModelSelectorOpen(false);
                                }}
                                value={m.name}
                              >
                                <ModelSelectorLogo provider={m.provider} />
                                <ModelSelectorName>{m.name}</ModelSelectorName>
                                {premium && <PremiumModelBadge />}
                                <ModelCapabilityIcons
                                  className="mr-2"
                                  capabilities={getCapabilities(m.id)}
                                />
                                {model === m.id && (
                                  <CheckIcon className="ml-auto size-4" />
                                )}
                              </ModelSelectorItem>
                            );
                          })(),
                        )}
                      </ModelSelectorGroup>
                    ))}
                  </ModelSelectorList>
                </ModelSelectorContent>
              </ModelSelector>
              <PromptInputButton
                type="button"
                onClick={() => {
                  if (!onWebSearchToggle) return;
                  onWebSearchToggle();
                }}
                className={
                  webSearchEnabled
                    ? "bg-primary/10 text-primary hover:bg-primary/15"
                    : "text-muted-foreground/70 hover:text-muted-foreground"
                }
                title={
                  webSearchEnabled
                    ? "Web search enabled"
                    : canSearch
                      ? "Enable web search"
                      : "Enable web search (model support checked server-side)"
                }
              >
                <CiGlobe className="h-4 w-4" />
              </PromptInputButton>
              <PromptInputButton
                type="button"
                onClick={handleAttachClick}
                className="text-muted-foreground hover:text-foreground"
                title="Attach files"
              >
                <FaPaperclip className="h-3.5 w-3.5" />
              </PromptInputButton>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,text/*,application/json,application/xml,application/x-yaml,text/xml,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/ogg,audio/webm,audio/flac"
                onChange={handleFileSelect}
                className="hidden"
              />
              {canGenerateImage && onImageAspectRatioChange && (
                <div className="flex items-center gap-1 border-l border-border/60 pl-1">
                  <ImageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <Select
                    value={imageSize ?? (imageAspectRatio || "auto")}
                    onValueChange={(v) => {
                      if (v === "default" || v === "") {
                        onImageSizeChange?.(null);
                        onImageAspectRatioChange("auto");
                      } else if (IMAGE_SIZE_VALUES.has(v)) {
                        onImageSizeChange?.(v);
                        onImageAspectRatioChange("auto");
                      } else if (IMAGE_ASPECT_VALUES.has(v)) {
                        onImageSizeChange?.(null);
                        onImageAspectRatioChange(v);
                      } else {
                        onImageSizeChange?.(null);
                        onImageAspectRatioChange("auto");
                      }
                    }}
                  >
                    <SelectTrigger
                      className="h-8 min-w-[5rem] w-fit border border-input text-xs text-muted-foreground"
                      title="Image aspect / size"
                    >
                      <SelectValue placeholder="Aspect" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {IMAGE_ASPECT_OPTIONS.map((o) => (
                          <SelectItem
                            key={o.value}
                            value={o.value}
                            disabled={!supportedAspectRatios.has(o.value)}
                          >
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Size</SelectLabel>
                        {IMAGE_SIZE_OPTIONS.map((o) => (
                          <SelectItem
                            key={o.value}
                            value={o.value}
                            disabled={o.value !== "default" && !supportedSizes.has(o.value)}
                          >
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </PromptInputTools>
            <PromptInputSubmit onStop={onStop} />
          </PromptInputFooter>
        </PromptInput>
      </PromptInputProvider>
    </div>
  );
}
