"use client";

import type { ChangeEvent } from "react";
import { Loader2, Presentation, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SLIDES_UPLOAD_ACCEPT } from "@/app/(app)/slides/slides.constants";

type SlidesInputPanelProps = {
  documentText: string;
  docName: string | null;
  audience: string;
  tone: string;
  language: string;
  slideCount: number;
  isGenerating: boolean;
  onUploadDoc: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDocumentTextChange: (value: string) => void;
  onAudienceChange: (value: string) => void;
  onToneChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onSlideCountChange: (value: number) => void;
  onGenerate: () => Promise<void>;
};

export function SlidesInputPanel({
  documentText,
  docName,
  audience,
  tone,
  language,
  slideCount,
  isGenerating,
  onUploadDoc,
  onDocumentTextChange,
  onAudienceChange,
  onToneChange,
  onLanguageChange,
  onSlideCountChange,
  onGenerate,
}: SlidesInputPanelProps) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
            Docs to Slides
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
            Convert documents into beautiful decks
          </h1>
        </div>
        <Presentation className="h-5 w-5 text-primary" />
      </div>

      <label className="mb-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-background/60 px-3 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
        <Upload className="h-4 w-4" />
        <span>
          {docName
            ? `Loaded: ${docName}`
            : "Upload document (txt/md/csv/json/xml/pdf/docx)"}
        </span>
        <input
          type="file"
          accept={SLIDES_UPLOAD_ACCEPT}
          className="hidden"
          onChange={onUploadDoc}
        />
      </label>

      <div className="space-y-3">
        <Textarea
          value={documentText}
          onChange={(event) => onDocumentTextChange(event.target.value)}
          placeholder="Paste document text here or upload txt/md/csv/json/xml/pdf/docx..."
          className="min-h-[200px] resize-y bg-background/70"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            value={audience}
            onChange={(event) => onAudienceChange(event.target.value)}
            placeholder="Audience"
            className="bg-background/70"
          />
          <Input
            value={language}
            onChange={(event) => onLanguageChange(event.target.value)}
            placeholder="Language"
            className="bg-background/70"
          />
        </div>

        <Input
          value={tone}
          onChange={(event) => onToneChange(event.target.value)}
          placeholder="Presentation tone"
          className="bg-background/70"
        />

        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Slide count</span>
            <span>{slideCount}</span>
          </div>
          <input
            type="range"
            min={4}
            max={20}
            step={1}
            value={slideCount}
            onChange={(event) => onSlideCountChange(Number(event.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <Button onClick={onGenerate} className="w-full" disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating slides...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate deck
            </>
          )}
        </Button>
      </div>
    </section>
  );
}
