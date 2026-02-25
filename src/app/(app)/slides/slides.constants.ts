import type { SlideAccent } from "@/app/(app)/slides/slides.types";

export const TEXT_EXTENSIONS = new Set([
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

export const PDF_EXTENSIONS = new Set(["pdf"]);
export const DOCX_EXTENSIONS = new Set(["docx"]);
export const LEGACY_WORD_EXTENSIONS = new Set(["doc"]);
export const PRESENTATION_EXTENSIONS = new Set(["ppt", "pptx"]);

export const SLIDES_UPLOAD_ACCEPT =
  ".txt,.md,.markdown,.csv,.json,.xml,.yml,.yaml,.log,.ini,.conf,.toml,.rtf,.pdf,.docx";

export const ACCENT_EXPORT_COLORS: Record<
  SlideAccent,
  { border: string; fill: string; bullet: string }
> = {
  insight: { border: "E24EB4", fill: "2E1B2D", bullet: "F35FC0" },
  data: { border: "22D3EE", fill: "152631", bullet: "22D3EE" },
  warning: { border: "FBBF24", fill: "2F240F", bullet: "FBBF24" },
  neutral: { border: "6F596F", fill: "1D1521", bullet: "D8C8DA" },
};
