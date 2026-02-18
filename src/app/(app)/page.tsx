"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useAction, useMutation } from "convex/react";
import {
  Copy,
  Link2,
  Loader2,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  HowToModal,
  HowToButton,
} from "@/features/import/components/HowToModal";
import { ChatInput } from "@/features/chat/components/ChatInput";
import { useSidebar } from "@/components/ui/sidebar";
import { api } from "../../../convex/_generated/api";
import {
  Provider,
  detectProvider,
  getProviderColor,
  getProviderDisplayName,
} from "@/utils/url-safety";
import { useIsProPlan } from "@/lib/use-is-pro-plan";
import { getDefaultModelForPlan, getModelById } from "@/lib/models";
import { savePendingChatDraft } from "@/lib/pending-chat-draft";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ScrapedImportMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const MODEL_PROVIDER_MAP: Record<string, Provider> = {
  openai: "chatgpt",
  anthropic: "claude",
  google: "gemini",
  deepseek: "unknown",
  minimax: "unknown",
  mistral: "mistral",
  perplexity: "perplexity",
  zai: "unknown",
  alibaba: "unknown",
};

export default function HomePage() {
  const router = useRouter();
  const { state: sidebarState, isMobile: isSidebarMobile } = useSidebar();
  const { user } = useUser();
  const isPro = useIsProPlan();
  const defaultModel = useMemo(() => getDefaultModelForPlan(isPro).id, [isPro]);
  const createChat = useMutation(api.chats.createChat);
  const scrapeUrl = useAction(api.firecrawl.scrapeUrl);

  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<string>("auto");
  const [imageSize, setImageSize] = useState<string | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const firstName = user?.firstName?.trim() || "there";
  const importProvider = useMemo(() => detectProvider(importUrl), [importUrl]);

  const startChatFromPrompt = useCallback(
    async (prompt: string, files?: File[]) => {
      if (isCreatingChat || !prompt.trim()) return;
      setIsCreatingChat(true);

      try {
        const model = getModelById(selectedModel);
        const provider = model
          ? (MODEL_PROVIDER_MAP[model.provider] ?? "unknown")
          : "unknown";
        const title = prompt.trim().slice(0, 60) || "New Conversation";

        const chatId = await createChat({
          title,
          provider,
          importMethod: "manual",
          messages: [],
        });

        if (files?.length) {
          toast.info(
            "Attachments will be available once the chat opens. Please attach again if needed.",
          );
        }

        savePendingChatDraft(String(chatId), {
          text: prompt,
          model: selectedModel,
          webSearchEnabled,
          imageAspectRatio,
          imageSize,
        });

        router.push(`/chat/${chatId}`);
      } catch (err: unknown) {
        const data = (err as { data?: { message?: string } })?.data;
        const message =
          data?.message ||
          (err instanceof Error ? err.message : "Failed to start chat");
        toast.error(message);
      } finally {
        setIsCreatingChat(false);
      }
    },
    [
      createChat,
      imageAspectRatio,
      imageSize,
      isCreatingChat,
      router,
      selectedModel,
      webSearchEnabled,
    ],
  );

  const handleImport = useCallback(async () => {
    if (!importUrl.trim()) {
      toast.error("Please paste a shared link.");
      return;
    }

    try {
      const urlObj = new URL(importUrl.trim());
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        toast.error("Please enter a valid HTTP/HTTPS URL.");
        return;
      }
    } catch {
      toast.error("Please enter a valid URL.");
      return;
    }

    setIsImporting(true);
    try {
      const result = await scrapeUrl({ url: importUrl.trim() });
      const messages = (result.messages ?? []) as ScrapedImportMessage[];
      if (messages.length === 0) {
        toast.error("Could not extract messages from this link.");
        return;
      }

      const chatId = await createChat({
        title: result.title || "Imported Chat",
        provider: importProvider || "unknown",
        sourceUrl: importUrl.trim(),
        importMethod: "automatic",
        messages,
      });

      setImportUrl("");
      setImportModalOpen(false);
      router.push(`/chat/${chatId}?imported=true`);
    } catch (err: unknown) {
      const data = (err as { data?: { message?: string } })?.data;
      const message =
        data?.message ||
        (err instanceof Error ? err.message : "Failed to import chat");
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  }, [createChat, importProvider, importUrl, router, scrapeUrl]);

  return (
    <>
      <HowToModal />

      <div className="relative flex h-full flex-col">
        <div className="flex-1 overflow-y-auto pb-56">
          <div className="mx-auto flex min-h-[calc(100dvh-10rem)] w-full max-w-3xl flex-col items-center justify-center px-4 pt-16 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
              Kontinue AI
            </p>
            <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              How can I help you, {firstName}?
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Ask anything to start a new chat, or import a shared link from another AI app.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <HowToButton />
              <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-card/70 px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-card"
                  >
                    <ArrowUpRight className="h-4 w-4 text-primary" />
                    Import shared link
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Import conversation</DialogTitle>
                    <DialogDescription>
                      Paste a shared link and continue the conversation in Kontinue AI.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3">
                    <div className="relative">
                      <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="url"
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Detected provider</span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md border px-2 py-1",
                          importProvider !== "unknown"
                            ? "border-primary/30 text-primary"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: getProviderColor(importProvider) }}
                        />
                        {getProviderDisplayName(importProvider)}
                      </span>
                    </div>
                  </div>

                  <DialogFooter>
                    <button
                      type="button"
                      onClick={() => setImportModalOpen(false)}
                      disabled={isImporting}
                      className="rounded-lg border border-border/70 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleImport}
                      disabled={isImporting}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        "Import chat"
                      )}
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="mt-10 w-full rounded-2xl border border-border/70 bg-card/60 p-5 text-left shadow-sm">
              <p className="text-sm font-medium text-foreground">How it works</p>
              <div className="mt-4 space-y-3">
                <Step
                  icon={<Copy size={15} />}
                  title="Start from chat input"
                  description="Type your prompt below. A new conversation opens instantly."
                />
                <Step
                  icon={<Link2 size={15} />}
                  title="Import when needed"
                  description="Use the import button to paste a shared link in a modal."
                />
                <Step
                  icon={<Sparkles size={15} />}
                  title="Continue naturally"
                  description="Pick your model and keep going with full context."
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <ProviderPill name="ChatGPT" color="#10a37f" />
                <ProviderPill name="Claude" color="#cc785c" />
                <ProviderPill name="Gemini" color="#4285f4" />
                <ProviderPill name="T3 Chat" color="#f8e6f4" />
                <ProviderPill name="Perplexity" color="#20b8cd" />
                <ProviderPill name="Mistral" color="#ffffff" />
              </div>
            </div>
          </div>
        </div>

        <div
          data-sidebar-state={sidebarState}
          className="pointer-events-none fixed bottom-0 z-40 px-4 pb-5 transition-[left,width] duration-300"
          style={{
            left:
              !isSidebarMobile && sidebarState === "expanded"
                ? "var(--sidebar-width)"
                : 0,
            width:
              !isSidebarMobile && sidebarState === "expanded"
                ? "calc(100vw - var(--sidebar-width))"
                : "100vw",
          }}
        >
          <div className="pointer-events-auto relative mx-auto w-full max-w-3xl">
            <ChatInput
              onSend={startChatFromPrompt}
              isLoading={isCreatingChat}
              disabled={false}
              model={selectedModel}
              onModelChange={setSelectedModel}
              webSearchEnabled={webSearchEnabled}
              onWebSearchToggle={() => setWebSearchEnabled((prev) => !prev)}
              imageAspectRatio={imageAspectRatio}
              imageSize={imageSize}
              onImageAspectRatioChange={setImageAspectRatio}
              onImageSizeChange={setImageSize}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function Step({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/40 text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function ProviderPill({ name, color }: { name: string; color: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/40 px-3 py-1 text-xs text-secondary-foreground">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span>{name}</span>
    </div>
  );
}
