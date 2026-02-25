import type { SlideAccent } from "@/app/(app)/slides/slides.types";

export function toPptxFileName(title: string): string {
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${sanitized || "slide-deck"}.pptx`;
}

export function getAccentClasses(accent: SlideAccent): string {
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

export function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1].toLowerCase();
}
