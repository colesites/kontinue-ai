"use client";

import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GeneratedDeck } from "@/app/(app)/slides/slides.types";
import { getAccentClasses } from "@/app/(app)/slides/slides.utils";

type SlidesPreviewPanelProps = {
  deck: GeneratedDeck | null;
  selectedSlideIndex: number;
  onSelectSlide: (index: number) => void;
  onExportPptx: () => Promise<void>;
  isExportingPptx: boolean;
};

export function SlidesPreviewPanel({
  deck,
  selectedSlideIndex,
  onSelectSlide,
  onExportPptx,
  isExportingPptx,
}: SlidesPreviewPanelProps) {
  const activeSlide = deck?.slides[selectedSlideIndex] ?? null;

  return (
    <section className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm">
      {!deck || !activeSlide ? (
        <div className="flex min-h-[620px] items-center justify-center rounded-xl border border-dashed border-border/70 bg-background/40 p-8 text-center text-muted-foreground">
          Generate a deck to preview slides here.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
            {deck.slides.map((slide, index) => (
              <button
                key={`${slide.title}-${index}`}
                type="button"
                onClick={() => onSelectSlide(index)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  index === selectedSlideIndex
                    ? "border-primary/60 bg-primary/10"
                    : "border-border/70 bg-background/60 hover:bg-background/80"
                }`}
              >
                <p className="text-xs text-muted-foreground">Slide {index + 1}</p>
                <p className="mt-1 line-clamp-2 text-sm font-medium text-foreground">
                  {slide.title}
                </p>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div
              className={`rounded-2xl border p-6 shadow-sm ${getAccentClasses(
                activeSlide.accent,
              )}`}
            >
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {deck.deckTitle}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {activeSlide.title}
              </h2>
              {activeSlide.subtitle && (
                <p className="mt-2 text-sm text-muted-foreground">{activeSlide.subtitle}</p>
              )}

              <ul className="mt-5 space-y-2">
                {activeSlide.bullets.map((bullet, index) => (
                  <li key={`${bullet}-${index}`} className="flex items-start gap-2 text-sm">
                    <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-primary/80" />
                    <span className="text-foreground/95">{bullet}</span>
                  </li>
                ))}
              </ul>

              {activeSlide.visualIdea && (
                <div className="mt-5 rounded-lg border border-border/70 bg-background/50 p-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Visual idea: </span>
                  {activeSlide.visualIdea}
                </div>
              )}
            </div>

            {activeSlide.speakerNotes && (
              <div className="rounded-xl border border-border/70 bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Speaker notes
                </p>
                <p className="mt-2 text-sm text-foreground/90">{activeSlide.speakerNotes}</p>
              </div>
            )}

            <Button
              type="button"
              variant="secondary"
              onClick={onExportPptx}
              disabled={isExportingPptx}
              className="border border-border/70"
            >
              {isExportingPptx ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download PPTX
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
