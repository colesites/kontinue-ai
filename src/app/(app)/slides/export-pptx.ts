import { ACCENT_EXPORT_COLORS } from "@/app/(app)/slides/slides.constants";
import type { GeneratedDeck } from "@/app/(app)/slides/slides.types";
import { toPptxFileName } from "@/app/(app)/slides/slides.utils";

export async function exportDeckToPptx(deck: GeneratedDeck): Promise<void> {
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
}
