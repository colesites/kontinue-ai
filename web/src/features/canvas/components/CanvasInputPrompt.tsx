"use client";

import { Paperclip, Loader2, ArrowUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { cn } from "../../../lib/utils";

interface CanvasInputPromptProps {
  prompt: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  canSubmit: boolean;
  mode: "image" | "video";
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  activeModel: string;
  maxChars?: number;
}

export function CanvasInputPrompt({
  prompt,
  onChange,
  onSubmit,
  isGenerating,
  canSubmit,
  mode,
  fileInputRef,
  textareaRef,
  activeModel,
  maxChars,
}: CanvasInputPromptProps) {
  const charsRemaining = maxChars ? maxChars - prompt.length : 0;

  return (
    <div className="flex flex-col gap-1 pb-1">
      <div className="flex items-end gap-2 px-3 pt-4 sm:gap-3 sm:px-8 sm:pt-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-foreground/40 transition-colors hover:bg-secondary/40 hover:text-foreground sm:h-10 sm:w-10"
            >
              <Paperclip className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-popover text-popover-foreground border-border"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider">
              Attach image
            </p>
          </TooltipContent>
        </Tooltip>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={() => {}}
        />

        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={onChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            rows={1}
            maxLength={maxChars}
            placeholder={
              mode === "image"
                ? "What do you want to create?"
                : "Describe your video..."
            }
            className="min-w-0 w-full resize-none bg-transparent py-2 text-base font-semibold text-foreground placeholder:text-muted-foreground/30 focus:outline-none scrollbar-hide max-h-40 sm:py-3"
            disabled={isGenerating}
          />
          {maxChars && (
            <div className={cn(
              "absolute -bottom-1 right-0 text-[10px] font-black uppercase tracking-widest transition-colors",
              charsRemaining <= 10 ? "text-destructive" : "text-foreground/20"
            )}>
              {prompt.length}/{maxChars}
            </div>
          )}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              className={cn(
                "mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 sm:h-11 sm:w-11",
                canSubmit
                  ? "bg-foreground text-background hover:scale-105 active:scale-95"
                  : "bg-secondary/20 text-foreground/20 cursor-not-allowed",
              )}
            >
              {isGenerating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowUp className="h-6 w-6" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-popover text-popover-foreground border-border"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider">
              Generate
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
