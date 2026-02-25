import type { GeneratedDeck } from "@/app/(app)/slides/slides.types";

type GenerateDeckOptions = {
  text: string;
  audience: string;
  tone: string;
  language: string;
  slideCount: number;
};

export async function generateDeck(options: GenerateDeckOptions): Promise<GeneratedDeck> {
  const response = await fetch("/api/slides/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });

  const payload = (await response.json()) as unknown;
  if (!response.ok) {
    const error =
      typeof payload === "object" && payload !== null && "error" in payload
        ? (payload as { error?: string }).error
        : undefined;
    throw new Error(error || "Failed to generate slides.");
  }

  return payload as GeneratedDeck;
}
