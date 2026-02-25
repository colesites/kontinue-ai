export type SlideAccent = "insight" | "data" | "warning" | "neutral";

export interface GeneratedSlide {
  title: string;
  subtitle?: string;
  bullets: string[];
  visualIdea?: string;
  speakerNotes?: string;
  accent: SlideAccent;
}

export interface GeneratedDeck {
  deckTitle: string;
  deckSubtitle?: string;
  themeDirection: string;
  slides: GeneratedSlide[];
}
