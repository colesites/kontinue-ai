"use client";

import type { ReactNode } from "react";
import { Copy, Link2, Sparkles } from "lucide-react";
import { HowToButton } from "@/features/import/components/HowToButton";
import { type Provider } from "@/utils/url-safety";
import { HomeImportDialog } from "@/features/home/components/HomeImportDialog";

type HomeIntroSectionProps = {
  firstName: string;
  importModalOpen: boolean;
  onImportModalOpenChange: (open: boolean) => void;
  importUrl: string;
  onImportUrlChange: (value: string) => void;
  importProvider: Provider;
  isImporting: boolean;
  onImport: () => void;
};

function Step({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
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

export function HomeIntroSection({
  firstName,
  importModalOpen,
  onImportModalOpenChange,
  importUrl,
  onImportUrlChange,
  importProvider,
  isImporting,
  onImport,
}: HomeIntroSectionProps) {
  return (
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
        <HomeImportDialog
          open={importModalOpen}
          onOpenChange={onImportModalOpenChange}
          importUrl={importUrl}
          onImportUrlChange={onImportUrlChange}
          importProvider={importProvider}
          isImporting={isImporting}
          onImport={onImport}
        />
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
  );
}
