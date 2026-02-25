"use client";

import { ArrowUpRight, Link2, Loader2 } from "lucide-react";
import { Provider, PROVIDER_CONFIG } from "@/utils/url-safety";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type HomeImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importUrl: string;
  onImportUrlChange: (value: string) => void;
  importProvider: Provider;
  isImporting: boolean;
  onImport: () => void;
};

export function HomeImportDialog({
  open,
  onOpenChange,
  importUrl,
  onImportUrlChange,
  importProvider,
  isImporting,
  onImport,
}: HomeImportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onChange={(event) => onImportUrlChange(event.target.value)}
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
                style={{ backgroundColor: PROVIDER_CONFIG[importProvider].color }}
              />
              {PROVIDER_CONFIG[importProvider].name}
            </span>
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
            className="rounded-lg border border-border/70 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onImport}
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
  );
}
