export const SPEECH_LANGUAGE_STORAGE_KEY = "speech-input-language";
export const SPEECH_LANGUAGE_CHANGED_EVENT = "speech-language-changed";
export const SPEECH_AUTO_LANGUAGE = "auto";

export interface SpeechLanguageOption {
  value: string;
  label: string;
  nativeLabel?: string;
}

export const SPEECH_LANGUAGE_OPTIONS: SpeechLanguageOption[] = [
  { value: SPEECH_AUTO_LANGUAGE, label: "Auto detect (Recommended)" },
  { value: "en-US", label: "English (United States)", nativeLabel: "English" },
  { value: "en-GB", label: "English (United Kingdom)", nativeLabel: "English" },
  { value: "yo-NG", label: "Yoruba (Nigeria)", nativeLabel: "Yoruba" },
  { value: "ig-NG", label: "Igbo (Nigeria)", nativeLabel: "Igbo" },
  { value: "ha-NG", label: "Hausa (Nigeria)", nativeLabel: "Hausa" },
  { value: "fr-FR", label: "French (France)", nativeLabel: "Francais" },
  { value: "es-ES", label: "Spanish (Spain)", nativeLabel: "Espanol" },
  { value: "pt-BR", label: "Portuguese (Brazil)", nativeLabel: "Portugues" },
  { value: "de-DE", label: "German (Germany)", nativeLabel: "Deutsch" },
  { value: "it-IT", label: "Italian (Italy)", nativeLabel: "Italiano" },
  { value: "nl-NL", label: "Dutch (Netherlands)", nativeLabel: "Nederlands" },
  { value: "pl-PL", label: "Polish (Poland)", nativeLabel: "Polski" },
  { value: "tr-TR", label: "Turkish (Turkey)", nativeLabel: "Turkce" },
  { value: "ru-RU", label: "Russian (Russia)", nativeLabel: "Russkiy" },
  { value: "ar-SA", label: "Arabic (Saudi Arabia)", nativeLabel: "al arabiyya" },
  { value: "hi-IN", label: "Hindi (India)", nativeLabel: "Hindi" },
  { value: "bn-BD", label: "Bengali (Bangladesh)", nativeLabel: "Bangla" },
  { value: "sw-KE", label: "Swahili (Kenya)", nativeLabel: "Kiswahili" },
  { value: "zh-CN", label: "Chinese (Simplified)", nativeLabel: "Jian ti zhong wen" },
  { value: "zh-TW", label: "Chinese (Traditional)", nativeLabel: "Fan ti zhong wen" },
  { value: "ja-JP", label: "Japanese (Japan)", nativeLabel: "Nihongo" },
  { value: "ko-KR", label: "Korean (Korea)", nativeLabel: "Hangugeo" },
  { value: "th-TH", label: "Thai (Thailand)", nativeLabel: "Thai" },
  { value: "vi-VN", label: "Vietnamese (Vietnam)", nativeLabel: "Tieng Viet" },
  { value: "id-ID", label: "Indonesian (Indonesia)", nativeLabel: "Bahasa Indonesia" },
];

const VALID_VALUES = new Set(SPEECH_LANGUAGE_OPTIONS.map((option) => option.value));

export function normalizeSpeechLanguage(value: string | null | undefined): string {
  if (!value) return SPEECH_AUTO_LANGUAGE;
  return VALID_VALUES.has(value) ? value : SPEECH_AUTO_LANGUAGE;
}

export function getSavedSpeechLanguage(): string {
  if (typeof window === "undefined") return SPEECH_AUTO_LANGUAGE;
  return normalizeSpeechLanguage(localStorage.getItem(SPEECH_LANGUAGE_STORAGE_KEY));
}

export function setSavedSpeechLanguage(value: string): string {
  const normalized = normalizeSpeechLanguage(value);
  if (typeof window === "undefined") return normalized;
  localStorage.setItem(SPEECH_LANGUAGE_STORAGE_KEY, normalized);
  window.dispatchEvent(
    new CustomEvent<string>(SPEECH_LANGUAGE_CHANGED_EVENT, { detail: normalized }),
  );
  return normalized;
}
