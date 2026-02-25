import mammoth from "mammoth";
import {
  DOCX_EXTENSIONS,
  LEGACY_WORD_EXTENSIONS,
  PDF_EXTENSIONS,
  PRESENTATION_EXTENSIONS,
  TEXT_EXTENSIONS,
} from "@/app/(app)/slides/slides.constants";
import { getFileExtension } from "@/app/(app)/slides/slides.utils";

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = getFileExtension(file.name);
  const isTextMime = file.type.startsWith("text/");
  const isTextType = isTextMime || TEXT_EXTENSIONS.has(ext);

  if (isTextType) {
    return file.text();
  }

  if (PDF_EXTENSIONS.has(ext) || file.type === "application/pdf") {
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
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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

  if (LEGACY_WORD_EXTENSIONS.has(ext) || file.type === "application/msword") {
    throw new Error("DOC files are not supported yet. Save as DOCX and upload.");
  }

  if (PRESENTATION_EXTENSIONS.has(ext)) {
    throw new Error(
      "PPT/PPTX extraction is not supported yet. Paste the content text into the box below.",
    );
  }

  throw new Error("Unsupported document type for slide conversion.");
}
