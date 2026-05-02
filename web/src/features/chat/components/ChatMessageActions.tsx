"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { TfiReload } from "react-icons/tfi";
import { HiSpeakerWave } from "react-icons/hi2";
import { cn } from "../../../utils/cn";
import { useCopyToClipboard } from "../../../hooks/use-copy-to-clipboard";
import { useTextToSpeech } from "../hooks/use-text-to-speech";
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorTrigger,
} from "../../../components/ai-elements/model-selector";
import { SharedModelSelectorContent } from "../../../components/ai-elements/shared-model-selector-content";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";

interface ChatMessageActionsProps {
  content: string;
  isUser: boolean;
  onRetry?: () => void;
  onSwitchModel?: (modelId: string) => void;
  modelOptionsByProvider?: Record<
    string,
    { id: string; name: string; disabled?: boolean }[]
  >;
  currentModelId?: string;
  isImported?: boolean;
}

export function ChatMessageActions({
  content,
  isUser,
  onRetry,
  onSwitchModel,
  modelOptionsByProvider,
  currentModelId,
  isImported,
}: ChatMessageActionsProps) {
  const [switchModelOpen, setSwitchModelOpen] = useState(false);
  const { copied, copyToClipboard } = useCopyToClipboard();
  const { isSpeaking, speechText, handleSpeak } = useTextToSpeech(content);

  const handleCopy = () => copyToClipboard(content);

  return (
    <div
      className={cn(
        "mt-2 flex items-center gap-2 text-xs text-muted-foreground transition-opacity",
        "opacity-60 group-hover:opacity-100",
        isUser && "justify-end",
      )}
    >
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-muted hover:text-foreground transition-colors"
      >
        {copied ? (
          <>
            <Check size={12} />
            Copied
          </>
        ) : (
          <>
            <Copy size={12} />
            Copy
          </>
        )}
      </button>
      {!isUser && (
        <>
          <button
            onClick={handleSpeak}
            disabled={!speechText}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors",
              speechText
                ? "hover:bg-muted hover:text-foreground"
                : "opacity-50 cursor-not-allowed",
            )}
            title={isSpeaking ? "Stop reading" : "Read aloud"}
          >
            <HiSpeakerWave className="h-3.5 w-3.5" />
            {isSpeaking ? "Stop" : "Speak"}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-muted hover:text-foreground transition-colors"
                title="Retry options"
              >
                <TfiReload className="h-3.5 w-3.5" />
                Retry
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={onRetry} disabled={!onRetry}>
                Try again
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSwitchModelOpen(true)}>
                Switch model
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ModelSelector
            open={switchModelOpen}
            onOpenChange={setSwitchModelOpen}
          >
            <ModelSelectorTrigger asChild>
              <button className="hidden" aria-hidden="true" />
            </ModelSelectorTrigger>
            <ModelSelectorContent className="sm:max-w-4xl h-[75vh] sm:h-[600px] p-0 flex flex-col overflow-hidden bg-background">
              <SharedModelSelectorContent
                selectedModelId={currentModelId}
                onModelSelect={(id) => {
                  onSwitchModel?.(id);
                  setSwitchModelOpen(false);
                }}
                modelIdsFilter={
                  modelOptionsByProvider
                    ? Object.values(modelOptionsByProvider)
                        .flat()
                        .filter((m) => !m.disabled)
                        .map((m) => m.id)
                    : undefined
                }
              />
            </ModelSelectorContent>
          </ModelSelector>
        </>
      )}
      {isImported && (
        <span className="text-[11px] px-2 py-1 rounded-md bg-muted/50 border border-border text-muted-foreground">
          Imported
        </span>
      )}
    </div>
  );
}
