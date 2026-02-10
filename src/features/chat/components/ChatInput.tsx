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
import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { AVAILABLE_MODELS } from "@/lib/models";
import { useModelCapabilities } from "@/lib/use-model-capabilities";
import { ModelCapabilityIcons } from "@/components/ai-elements/model-capability-icons";
import { useIsProPlan } from "@/lib/use-is-pro-plan";
import { PremiumModelBadge } from "@/components/ai-elements/premium-model-badge";
import type { ChatInputProps } from "@/features/chat/types";

const IMAGE_ASPECT_OPTIONS: { value: string; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "1:1", label: "1:1" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
];

const IMAGE_SIZE_OPTIONS: { value: string; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "1024x1024", label: "1024×1024" },
  { value: "1536x1024", label: "1536×1024" },
  { value: "1024x1536", label: "1024×1536" },
];

export function ChatInput({
  onSend,
  isLoading,
  disabled,
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
      setAttachedFiles((prev) => [...prev, ...files]);
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
              <div className="flex flex-wrap gap-2 mt-2 px-1">
                {attachedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border/50 text-xs group hover:bg-muted transition-colors"
                  >
                    <span className="text-muted-foreground">
                      {file.type.startsWith("image/")
                        ? "🖼️"
                        : file.type.startsWith("video/")
                          ? "🎥"
                          : file.type.startsWith("audio/")
                            ? "🎵"
                            : file.type === "application/pdf"
                              ? "📄"
                              : "📎"}
                    </span>
                    <span className="text-foreground max-w-[150px] truncate">
                      {file.name}
                    </span>
                    <span className="text-muted-foreground/70">
                      ({(file.size / 1024).toFixed(1)}KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-1 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Remove file"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
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
                disabled={!canSearch}
                onClick={() => {
                  if (!canSearch || !onWebSearchToggle) return;
                  onWebSearchToggle();
                }}
                className={
                  webSearchEnabled && canSearch
                    ? "bg-primary/10 text-primary hover:bg-primary/15"
                    : "text-muted-foreground/50 hover:text-muted-foreground/70"
                }
                title={
                  canSearch
                    ? webSearchEnabled
                      ? "Web search enabled"
                      : "Enable web search"
                    : "Web search not available"
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
                accept="image/*,video/*,audio/*,.pdf,.txt,.doc,.docx,.csv,.json,.xml,.md"
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
                      } else if (v.startsWith("1") || v.startsWith("1536")) {
                        onImageSizeChange?.(v);
                        onImageAspectRatioChange("auto");
                      } else {
                        onImageSizeChange?.(null);
                        onImageAspectRatioChange(v);
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
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Size</SelectLabel>
                        {IMAGE_SIZE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </PromptInputTools>
            <PromptInputSubmit />
          </PromptInputFooter>
        </PromptInput>
      </PromptInputProvider>
    </div>
  );
}
