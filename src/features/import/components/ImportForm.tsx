"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useAction } from "convex/react";
import { Link2, Loader2, AlertCircle, CheckIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import {
  detectProvider,
  getProviderDisplayName,
  getProviderColor,
  Provider,
} from "@/utils/url-safety";
import { useImportStore } from "../lib/useImportStore";
import { api } from "../../../../convex/_generated/api";
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
import { AVAILABLE_MODELS, getModelById } from "@/lib/models";



export function ImportForm() {
  const router = useRouter();
  const {
    status,
    url,
    provider,
    selectedModel,
    setUrl,
    setSelectedModel,
    setProvider,
    startImport,
    importSuccess,
    importError,
    reset,
  } = useImportStore();

  const scrapeUrl = useAction(api.firecrawl.scrapeUrl);
  const createChat = useMutation(api.chats.createChat);
  const [isStartingBlank, setIsStartingBlank] = useState(false);

  useEffect(() => {
    reset();
  }, [reset]);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    const detected = detectProvider(value);
    setProvider(detected);
  };

  const handleCreateChat = async () => {
    // If URL is empty, we are starting a blank chat
    if (!url.trim()) {
      await handleStartBlankChat();
      return;
    }

    // Otherwise, we are importing
    await handleImport();
  };

  const handleStartBlankChat = async () => {
    setIsStartingBlank(true);
    try {
      const modelData = getModelById(selectedModel);
      const providerMap: Record<string, Provider> = {
        openai: "chatgpt",
        anthropic: "claude",
        google: "gemini",
      };

      const chatProvider = modelData
        ? providerMap[modelData.provider]
        : "unknown";

      const chatId = await createChat({
        title: "New Conversation",
        provider: chatProvider,
        importMethod: "manual",
        messages: [],
      });

      setUrl("");
      router.push(`/chat/${chatId}`);
    } catch (err: unknown) {
      console.error("Start chat error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to start chat");
    } finally {
      setIsStartingBlank(false);
    }
  };

  const handleImport = async () => {
    // Validate URL
    try {
      const urlObj = new URL(url.trim());
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        toast.error("Please enter a valid HTTP/HTTPS URL");
        return;
      }
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    startImport();

    try {
      const result = await scrapeUrl({
        url: url.trim(),
      });

      if (!result.messages || result.messages.length === 0) {
        throw new Error(
          "Could not extract chat messages from this link. The page may not be a valid shared chat or the format is not recognized.",
        );
      }

      const chatId = await createChat({
        title: result.title || "Imported Chat",
        provider: provider || "unknown",
        sourceUrl: url,
        importMethod: "automatic",
        messages: result.messages.map(
          (m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant" | "system",
            content: m.content,
          }),
        ),
      });

      importSuccess(chatId);
      setUrl("");
      router.push(`/chat/${chatId}`);
    } catch (err: unknown) {
      console.error("Import error:", err);
      const message =
        err instanceof Error ? err.message : "Failed to import chat";
      importError(message);
      toast.error(message);
    }
  };

  const isProcessing = status === "importing" || isStartingBlank;
  const hasUrl = url.trim().length > 0;

  const helperText = hasUrl
    ? "We'll automatically scrape and import the conversation history for you."
    : "Or just select a model and start a fresh conversation without importing shortcut keys.";

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
          <p className="text-xs text-primary">{helperText}</p>
        </div>

        <div className="relative group/input flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <div className="relative flex-1 w-full">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Link2 size={20} />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Paste shared link (optional)..."
              disabled={isProcessing}
              className={cn(
                "w-full pl-12 pr-4 py-4 rounded-xl bg-background border text-foreground placeholder:text-muted-foreground placeholder:text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                provider && provider !== "unknown"
                  ? "border-primary/50"
                  : "border-input",
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isProcessing) {
                  handleCreateChat();
                }
              }}
            />
            {provider && provider !== "unknown" && (
              <div
                className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-xs font-medium"
                style={{
                  backgroundColor: `${getProviderColor(provider)}20`,
                  color: getProviderColor(provider),
                }}
              >
                {getProviderDisplayName(provider)}
              </div>
            )}
          </div>

          <div className="shrink-0 w-full sm:w-[220px]">
            <ModelSelectorWrapper
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              disabled={isProcessing}
            />
          </div>
        </div>

        <button
          onClick={handleCreateChat}
          disabled={isProcessing}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold transition-all shadow-lg",
            !isProcessing
              ? "bg-primary hover:bg-primary/90 text-primary-foreground"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {isStartingBlank ? "Starting Chat..." : "Importing..."}
            </>
          ) : (
            <>
              {hasUrl ? (
                <>Import Chat</>
              ) : (
                <>
                  <Plus size={18} />
                  Start Blank Chat
                </>
              )}
            </>
          )}
        </button>

        {status === "error" && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            Failed to import: {useImportStore.getState().error}
          </div>
        )}
      </div>
    </div>
  );
}

function ModelSelectorWrapper({
  selectedModel,
  onModelChange,
  disabled,
}: {
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedModelData = AVAILABLE_MODELS.find(
    (m) => m.id === selectedModel
  );

  const groupedModels = AVAILABLE_MODELS.reduce(
    (acc, m) => {
      if (!acc[m.provider]) acc[m.provider] = [];
      acc[m.provider].push(m);
      return acc;
    },
    {} as Record<string, typeof AVAILABLE_MODELS>
  );

  return (
    <ModelSelector open={open} onOpenChange={setOpen}>
      <ModelSelectorTrigger asChild>
        <button
          disabled={disabled}
          className="w-full sm:w-auto min-h-[56px] px-4 rounded-xl border border-input bg-background hover:bg-muted transition-colors flex items-center justify-center gap-2 group min-w-[140px]"
        >
          {selectedModelData && (
            <>
              <ModelSelectorLogo
                provider={selectedModelData.provider}
                className="size-4"
              />
              <span className="text-sm font-medium text-foreground truncate max-w-[80px]">
                {selectedModelData.name}
              </span>
            </>
          )}
        </button>
      </ModelSelectorTrigger>
      <ModelSelectorContent title="Select Model for Chat">
        <ModelSelectorInput placeholder="Search models..." />
        <ModelSelectorList>
          <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
          {Object.entries(groupedModels).map(([provider, models]) => (
            <ModelSelectorGroup heading={provider} key={provider}>
              {models.map((m) => (
                <ModelSelectorItem
                  key={m.id}
                  onSelect={() => {
                    onModelChange(m.id);
                    setOpen(false);
                  }}
                  value={m.name}
                >
                  <ModelSelectorLogo provider={m.provider} />
                  <ModelSelectorName>{m.name}</ModelSelectorName>
                  {selectedModel === m.id && (
                    <CheckIcon className="ml-auto size-4" />
                  )}
                </ModelSelectorItem>
              ))}
            </ModelSelectorGroup>
          ))}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}
