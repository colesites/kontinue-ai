"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

export function SettingsContactCards() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Link
        href="https://kontinueai.com/legal/privacy-policy"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl border border-border/60 bg-background/70 p-4 transition-colors hover:bg-background"
      >
        <p className="text-sm font-medium">Privacy Policy</p>
        <p className="mt-1 text-xs text-muted-foreground">
          How your data is handled.
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
          Open <ExternalLink className="h-3 w-3" />
        </span>
      </Link>

      <Link
        href="https://kontinueai.com/legal/terms-of-service"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl border border-border/60 bg-background/70 p-4 transition-colors hover:bg-background"
      >
        <p className="text-sm font-medium">Terms of Service</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Usage terms and responsibilities.
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
          Open <ExternalLink className="h-3 w-3" />
        </span>
      </Link>
    </div>
  );
}
