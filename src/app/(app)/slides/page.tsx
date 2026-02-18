"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import {
  Sparkles,
  Upload,
  Download,
  Loader2,
  Presentation,
} from "lucide-react";
import mammoth from "mammoth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type SlideAccent = "insight" | "data" | "warning" | "neutral";

interface GeneratedSlide {
  title: string;
  subtitle?: string;
  bullets: string[];
  visualIdea?: string;
  speakerNotes?: string;
  accent: SlideAccent;
}

interface GeneratedDeck {
  deckTitle: string;
  deckSubtitle?: string;
  themeDirection: string;
  slides: GeneratedSlide[];
}

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "markdown",
  "csv",
  "json",
  "xml",
  "yml",
  "yaml",
  "log",
  "ini",
  "conf",
  "toml",
  "rtf",
]);

const PDF_EXTENSIONS = new Set(["pdf"]);
const DOCX_EXTENSIONS = new Set(["docx"]);
const LEGACY_WORD_EXTENSIONS = new Set(["doc"]);
const PRESENTATION_EXTENSIONS = new Set(["ppt", "pptx"]);

const ACCENT_EXPORT_COLORS: Record<
  SlideAccent,
  { border: string; fill: string; bullet: string }
> = {
  insight: { border: "E24EB4", fill: "2E1B2D", bullet: "F35FC0" },
  data: { border: "22D3EE", fill: "152631", bullet: "22D3EE" },
  warning: { border: "FBBF24", fill: "2F240F", bullet: "FBBF24" },
  neutral: { border: "6F596F", fill: "1D1521", bullet: "D8C8DA" },
};

function toPptxFileName(title: string): string {
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${sanitized || "slide-deck"}.pptx`;
}

function getAccentClasses(accent: SlideAccent): string {
  switch (accent) {
    case "insight":
      return "border-primary/50 bg-primary/10";
    case "data":
      return "border-cyan-400/40 bg-cyan-500/10";
    case "warning":
      return "border-amber-400/40 bg-amber-500/10";
    default:
      return "border-border/70 bg-card/80";
  }
}

function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1].toLowerCase();
}

async function extractTextFromFile(file: File): Promise<string> {
  const ext = getFileExtension(file.name);
  const isTextMime = file.type.startsWith("text/");
  const isTextType = isTextMime || TEXT_EXTENSIONS.has(ext);

  if (isTextType) {
    return file.text();
  }

  if (
    PDF_EXTENSIONS.has(ext) ||
    file.type === "application/pdf"
  ) {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.mjs",
        import.meta.url,
      ).toString();
    }
    const data = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjs.getDocument({
      data,
      stopAtErrors: false,
    });
    const pdf = await loadingTask.promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .filter((text): text is string => Boolean(text))
        .join(" ")
        .trim();

      if (pageText) {
        pages.push(pageText);
      }
    }

    await loadingTask.destroy();

    const extracted = pages.join("\n\n").trim();
    if (!extracted) {
      throw new Error(
        "Could not extract text from this PDF. If it is scanned/image-only, paste text manually.",
      );
    }

    return extracted;
  }

  if (
    DOCX_EXTENSIONS.has(ext) ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer(),
    });
    const extracted = result.value.trim();

    if (!extracted) {
      throw new Error("Could not extract text from this DOCX file.");
    }

    return extracted;
  }

  if (
    LEGACY_WORD_EXTENSIONS.has(ext) ||
    file.type === "application/msword"
  ) {
    throw new Error("DOC files are not supported yet. Save as DOCX and upload.");
  }

  if (PRESENTATION_EXTENSIONS.has(ext)) {
    throw new Error(
      "PPT/PPTX extraction is not supported yet. Paste the content text into the box below.",
    );
  }

  throw new Error("Unsupported document type for slide conversion.");
}

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

  const activeSlide = useMemo(
    () => deck?.slides[selectedSlideIndex] ?? null,
    [deck, selectedSlideIndex],
  );

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

  const generateSlides = async () => {
    if (documentText.trim().length < 80) {
      toast.error("Please add enough document text (at least ~80 characters).");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/slides/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: documentText,
          audience,
          tone,
          language,
          slideCount,
        }),
      });

      const payload = (await response.json()) as GeneratedDeck | { error?: string };
      if (!response.ok) {
        throw new Error(
          (payload as { error?: string }).error || "Failed to generate slides.",
        );
      }

      setDeck(payload as GeneratedDeck);
      setSelectedSlideIndex(0);
      toast.success("Slides generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate slides.");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportPptx = async () => {
    if (!deck || isExportingPptx) return;
    setIsExportingPptx(true);
    try {
      const { default: PptxGenJS } = await import("pptxgenjs");
      const pptx = new PptxGenJS();
      const fileName = toPptxFileName(deck.deckTitle || "slide-deck");

      pptx.layout = "LAYOUT_WIDE";
      pptx.author = "Kontinue AI";
      pptx.company = "Kontinue AI";
      pptx.subject = deck.deckSubtitle || "AI generated slide deck";
      pptx.title = deck.deckTitle;

      for (const slideData of deck.slides) {
        const accent = ACCENT_EXPORT_COLORS[slideData.accent];
        const slide = pptx.addSlide();
        const bulletLines = slideData.bullets.join("\n");
        const subtitleOffset = slideData.subtitle ? 0.4 : 0;

        slide.background = { color: "0F0B12" };

        slide.addShape("roundRect", {
          x: 0.3,
          y: 0.25,
          w: 12.73,
          h: 6.95,
          line: { color: accent.border, width: 1.2 },
          fill: { color: accent.fill, transparency: 18 },
          rectRadius: 0.08,
        });

        slide.addText(deck.deckTitle.toUpperCase(), {
          x: 0.55,
          y: 0.4,
          w: 8.8,
          h: 0.3,
          color: "B89EB8",
          fontSize: 9,
          bold: true,
          charSpacing: 1.6,
        });

        slide.addText(slideData.title, {
          x: 0.55,
          y: 0.72,
          w: 10.8,
          h: 0.62,
          color: "F7F1F8",
          fontSize: 32,
          bold: true,
          fit: "shrink",
        });

        if (slideData.subtitle) {
          slide.addText(slideData.subtitle, {
            x: 0.55,
            y: 1.38,
            w: 10.8,
            h: 0.3,
            color: "DDCFDF",
            fontSize: 16,
            fit: "shrink",
          });
        }

        slide.addText(bulletLines, {
          x: 0.75,
          y: 1.82 + subtitleOffset,
          w: 10.85,
          h: 3.35 - subtitleOffset,
          color: "F2EDF4",
          fontSize: 19,
          bullet: { indent: 14 },
          fit: "shrink",
        });

        if (slideData.visualIdea) {
          slide.addShape("roundRect", {
            x: 0.55,
            y: 5.35,
            w: 11.2,
            h: 0.72,
            line: { color: "5C4C5E", width: 0.8 },
            fill: { color: "191218", transparency: 22 },
            rectRadius: 0.05,
          });
          slide.addText(`Visual idea: ${slideData.visualIdea}`, {
            x: 0.72,
            y: 5.52,
            w: 10.85,
            h: 0.36,
            color: "D7CBD9",
            fontSize: 12,
            fit: "shrink",
          });
        }

        if (slideData.speakerNotes) {
          slide.addNotes(`Speaker notes:\n${slideData.speakerNotes}`);
        }

        slide.addShape("line", {
          x: 0.55,
          y: 6.25,
          w: 11.2,
          h: 0,
          line: { color: accent.border, width: 0.8, transparency: 28 },
        });
        slide.addText(deck.themeDirection, {
          x: 0.55,
          y: 6.33,
          w: 8.8,
          h: 0.24,
          color: "A88EA8",
          fontSize: 9,
          italic: true,
          fit: "shrink",
        });
      }

      await pptx.writeFile({ fileName, compression: true });
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
              {docName ? `Loaded: ${docName}` : "Upload document (txt/md/csv/json/xml/pdf/docx)"}
            </span>
            <input
              type="file"
              accept=".txt,.md,.markdown,.csv,.json,.xml,.yml,.yaml,.log,.ini,.conf,.toml,.rtf,.pdf,.docx"
              className="hidden"
              onChange={onUploadDoc}
            />
          </label>

          <div className="space-y-3">
            <Textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="Paste document text here or upload txt/md/csv/json/xml/pdf/docx..."
              className="min-h-[200px] resize-y bg-background/70"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Audience"
                className="bg-background/70"
              />
              <Input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="Language"
                className="bg-background/70"
              />
            </div>

            <Input
              value={tone}
              onChange={(e) => setTone(e.target.value)}
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
                onChange={(e) => setSlideCount(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <Button onClick={generateSlides} className="w-full" disabled={isGenerating}>
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
                    onClick={() => setSelectedSlideIndex(index)}
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
                    {activeSlide.bullets.map((bullet, idx) => (
                      <li key={`${bullet}-${idx}`} className="flex items-start gap-2 text-sm">
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

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={exportPptx}
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
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
