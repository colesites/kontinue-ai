"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CiGlobe } from "react-icons/ci";
import { FaPaperclip } from "react-icons/fa";
import { IoMicOutline } from "react-icons/io5";

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

import { AttachmentPreview } from "./AttachmentPreview";
import { ChatInputModelSelector } from "./ChatInputModelSelector";
import { ChatInputImageOptions } from "./ChatInputImageOptions";

import { useSpeechInput } from "../hooks/use-speech-input";
import { useFileAttachments } from "../hooks/use-file-attachments";
import { useModelCapabilities } from "@/lib/use-model-capabilities";
import { AVAILABLE_MODELS } from "@/lib/models";
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
  } = useFileAttachments();

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    onSend(inputValue, attachedFiles.length > 0 ? attachedFiles : undefined);
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
            {isListening && (
              <div className="mt-2 px-1 text-xs text-primary/90">
                Listening...{" "}
                {activeRecognitionLanguage
                  ? `(${activeRecognitionLanguage})`
                  : ""}
              </div>
            )}
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
              <ChatInputModelSelector
                model={model}
                onModelChange={onModelChange}
                open={modelSelectorOpen}
                onOpenChange={setModelSelectorOpen}
              />
              <PromptInputButton
                type="button"
                onClick={onWebSearchToggle}
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
              {canGenerateImage &&
                onImageAspectRatioChange &&
                onImageSizeChange && (
                  <ChatInputImageOptions
                    model={model}
                    imageAspectRatio={imageAspectRatio}
                    imageSize={imageSize}
                    onImageAspectRatioChange={onImageAspectRatioChange}
                    onImageSizeChange={onImageSizeChange}
                  />
                )}
            </PromptInputTools>
            <div className="flex items-center gap-1">
              <PromptInputButton
                type="button"
                onClick={toggleListening}
                className={cn(
                  "text-muted-foreground transition-colors",
                  isListening
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "hover:text-foreground",
                )}
                title={
                  isListening
                    ? "Stop voice input"
                    : speechSupported
                      ? "Start voice input"
                      : "Speech recognition is not supported in this browser"
                }
                disabled={!speechSupported}
              >
                <IoMicOutline className="h-4 w-4" />
              </PromptInputButton>
              <PromptInputSubmit onStop={onStop} />
            </div>
          </PromptInputFooter>
        </PromptInput>
      </PromptInputProvider>
    </div>
  );
}
