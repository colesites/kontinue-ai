"use client";

import { useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { SlidesInputPanel } from "@/app/(app)/slides/components/SlidesInputPanel";
import { SlidesPreviewPanel } from "@/app/(app)/slides/components/SlidesPreviewPanel";
import { extractTextFromFile } from "@/app/(app)/slides/extract-document-text";
import { exportDeckToPptx } from "@/app/(app)/slides/export-pptx";
import { generateDeck } from "@/app/(app)/slides/generate-deck";
import type { GeneratedDeck } from "@/app/(app)/slides/slides.types";

export default function SlidesPage() {
  const [documentText, setDocumentText] = useState("");
  const [docName, setDocName] = useState<string | null>(null);
  const [audience, setAudience] = useState("Business stakeholders");
  const [tone, setTone] = useState("Modern, concise, confident");
  const [language, setLanguage] = useState("English");
  const [slideCount, setSlideCount] = useState(8);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [deck, setDeck] = useState<GeneratedDeck | null>(null);

  const onUploadDoc = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const text = await extractTextFromFile(file);
      setDocumentText(text);
      setDocName(file.name);
      toast.success(`${file.name} loaded. Ready to convert.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to read document.");
    } finally {
      input.value = "";
    }
  };

  const handleGenerate = async () => {
    if (documentText.trim().length < 80) {
      toast.error("Please add enough document text (at least ~80 characters).");
      return;
    }

    setIsGenerating(true);
    try {
      const generatedDeck = await generateDeck({
        text: documentText,
        audience,
        tone,
        language,
        slideCount,
      });

      setDeck(generatedDeck);
      setSelectedSlideIndex(0);
      toast.success("Slides generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate slides.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPptx = async () => {
    if (!deck || isExportingPptx) return;

    setIsExportingPptx(true);
    try {
      await exportDeckToPptx(deck);
      toast.success("PPTX downloaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export PPTX.");
    } finally {
      setIsExportingPptx(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-20 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <SlidesInputPanel
          documentText={documentText}
          docName={docName}
          audience={audience}
          tone={tone}
          language={language}
          slideCount={slideCount}
          isGenerating={isGenerating}
          onUploadDoc={onUploadDoc}
          onDocumentTextChange={setDocumentText}
          onAudienceChange={setAudience}
          onToneChange={setTone}
          onLanguageChange={setLanguage}
          onSlideCountChange={setSlideCount}
          onGenerate={handleGenerate}
        />

        <SlidesPreviewPanel
          deck={deck}
          selectedSlideIndex={selectedSlideIndex}
          onSelectSlide={setSelectedSlideIndex}
          onExportPptx={handleExportPptx}
          isExportingPptx={isExportingPptx}
        />
      </div>
    </div>
  );
}
