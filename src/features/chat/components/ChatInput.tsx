"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { IoMicOutline } from "react-icons/io5";

import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputProvider,
} from "@/components/ai-elements/prompt-input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { ChatInputBodyExtras } from "@/features/chat/components/ChatInputBodyExtras";
import { ChatInputTools } from "@/features/chat/components/ChatInputTools";

import { useSpeechInput } from "../hooks/use-speech-input";
import { useFileAttachments } from "../hooks/use-file-attachments";
import { useModelCapabilities } from "@/lib/use-model-capabilities";
import { AVAILABLE_MODELS } from "@/lib/models";
import { useIsProPlan } from "@/lib/use-plan-tier";
import type { ChatInputProps } from "@/features/chat/types";

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
  const [inputValue, setInputValue] = useState("");
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const canUsePaidFeatures = useIsProPlan();

  const { getCapabilities } = useModelCapabilities();
  const selectedModelData = AVAILABLE_MODELS.find((m) => m.id === model);
  const canSearch =
    !!selectedModelData &&
    getCapabilities(selectedModelData.id).includes("web-search");
  const canGenerateImage =
    !!selectedModelData &&
    getCapabilities(selectedModelData.id).includes("image-generation");

  const {
    isListening,
    activeRecognitionLanguage,
    speechSupported,
    toggleListening,
    stopListening,
  } = useSpeechInput({ inputValue, setInputValue });

  const {
    attachedFiles,
    fileInputRef,
    handleFileSelect,
    handleAttachClick,
    removeFile,
    clearFiles,
  } = useFileAttachments({ enabled: canUsePaidFeatures });

  useEffect(() => {
    if (!canUsePaidFeatures && attachedFiles.length > 0) {
      clearFiles();
    }
  }, [attachedFiles.length, canUsePaidFeatures, clearFiles]);

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    onSend(
      inputValue,
      canUsePaidFeatures && attachedFiles.length > 0 ? attachedFiles : undefined,
    );
    setInputValue("");
    clearFiles();
    if (isListening) stopListening();
  };

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
            <PromptInputTextarea />
            <ChatInputBodyExtras
              isListening={isListening}
              activeRecognitionLanguage={activeRecognitionLanguage}
              attachedFiles={attachedFiles}
              onRemoveFile={removeFile}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <ChatInputTools
              model={model}
              modelSelectorOpen={modelSelectorOpen}
              onModelSelectorOpenChange={setModelSelectorOpen}
              onModelChange={onModelChange}
              canUsePaidFeatures={canUsePaidFeatures}
              webSearchEnabled={canUsePaidFeatures ? webSearchEnabled : false}
              onWebSearchToggle={onWebSearchToggle}
              canSearch={canSearch}
              canGenerateImage={canGenerateImage}
              fileInputRef={fileInputRef}
              onAttachClick={handleAttachClick}
              onFileSelect={handleFileSelect}
              imageAspectRatio={imageAspectRatio}
              imageSize={imageSize}
              onImageAspectRatioChange={onImageAspectRatioChange}
              onImageSizeChange={onImageSizeChange}
            />
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <PromptInputButton
                    type="button"
                    onClick={toggleListening}
                    className={cn(
                      "text-muted-foreground transition-colors",
                      isListening
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "hover:text-foreground",
                    )}
                    aria-label={isListening ? "Stop voice input" : "Start voice input"}
                  >
                    <IoMicOutline className="h-4 w-4" />
                  </PromptInputButton>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>
                  {isListening
                    ? "Voice input is active. Click to stop."
                    : speechSupported
                      ? "Use your microphone to dictate."
                      : "Speech recognition is not supported in this browser."}
                </TooltipContent>
              </Tooltip>
              <PromptInputSubmit onStop={onStop} />
            </div>
          </PromptInputFooter>
        </PromptInput>
      </PromptInputProvider>
    </div>
  );
}
