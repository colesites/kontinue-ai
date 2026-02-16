"use client";

import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  PromptInputProvider,
} from "@/components/ai-elements/prompt-input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckIcon, ImageIcon, X } from "lucide-react";
import { CiGlobe } from "react-icons/ci";
import { FaPaperclip } from "react-icons/fa";
import { IoMicOutline } from "react-icons/io5";
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { validateFile } from "@/lib/file-upload";
import { AVAILABLE_MODELS } from "@/lib/models";
import { useModelCapabilities } from "@/lib/use-model-capabilities";
import { ModelCapabilityIcons } from "@/components/ai-elements/model-capability-icons";
import { useIsProPlan } from "@/lib/use-is-pro-plan";
import { PremiumModelBadge } from "@/components/ai-elements/premium-model-badge";
import type { ChatInputProps } from "@/features/chat/types";
import {
  getSavedSpeechLanguage,
  SPEECH_AUTO_LANGUAGE,
  SPEECH_LANGUAGE_OPTIONS,
  SPEECH_LANGUAGE_CHANGED_EVENT,
  SPEECH_LANGUAGE_STORAGE_KEY,
} from "@/lib/speech-settings";

type SpeechRecognitionAlternative = {
  transcript: string;
  confidence: number;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
};

type SpeechRecognitionResultList = {
  length: number;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;
const LANGUAGE_ROTATE_INTERVAL_MS = 5000;
const MIN_CONFIDENCE_TO_LOCK_LANGUAGE = 0.72;
const MIN_TRANSCRIPT_CHARS_TO_LOCK_WITHOUT_CONFIDENCE = 18;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const withSpeech = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return withSpeech.SpeechRecognition ?? withSpeech.webkitSpeechRecognition ?? null;
}

function buildSpeechLanguageCandidates(preferredLanguage: string): string[] {
  const candidates: string[] = [];
  const push = (value?: string | null) => {
    if (!value) return;
    if (!candidates.includes(value)) candidates.push(value);
  };

  if (preferredLanguage && preferredLanguage !== SPEECH_AUTO_LANGUAGE) {
    push(preferredLanguage);
  }

  if (typeof navigator !== "undefined") {
    push(navigator.language);
    for (const language of navigator.languages ?? []) {
      push(language);
    }
  }

  for (const option of SPEECH_LANGUAGE_OPTIONS) {
    if (option.value !== SPEECH_AUTO_LANGUAGE) {
      push(option.value);
    }
  }

  return candidates.length > 0 ? candidates : ["en-US"];
}

function mergeSpeechText(base: string, spoken: string): string {
  const normalizedBase = base.trim();
  const normalizedSpoken = spoken.trim();
  if (!normalizedSpoken) return normalizedBase;
  if (!normalizedBase) return normalizedSpoken;
  return `${normalizedBase} ${normalizedSpoken}`;
}

function AttachmentPreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const fileExt = file.name.split(".").pop()?.toUpperCase() ?? "";
  const isImage =
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|bmp|svg|heic|heif)$/i.test(file.name);
  const isVideo = file.type.startsWith("video/");
  const isAudio = file.type.startsWith("audio/");
  const isPdf =
    file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  const isText =
    file.type.startsWith("text/") ||
    [
      "application/json",
      "application/xml",
      "application/x-yaml",
      "text/xml",
    ].includes(file.type) ||
    /\.(txt|md|markdown|csv|json|xml|yml|yaml|log|ini|conf|env|toml)$/i.test(
      file.name,
    );
  const [imageError, setImageError] = useState(false);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const objectUrl = useMemo(() => {
    if (!isImage && !isVideo && !isAudio && !isPdf) return null;
    try {
      return URL.createObjectURL(file);
    } catch {
      return null;
    }
  }, [file, isImage, isVideo, isAudio, isPdf]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  useEffect(() => {
    if (!isText) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setTextPreview(text.slice(0, 800));
    };
    reader.onerror = () => setTextPreview(null);
    reader.readAsText(file.slice(0, 2000));
  }, [file, isText]);

  return (
    <div className="group relative flex min-w-[240px] max-w-[360px] items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-2.5 pr-9 shadow-sm">
      {isImage && objectUrl && !imageError ? (
        <img
          src={objectUrl}
          alt={file.name}
          className="h-16 w-16 rounded-lg border border-border/60 object-cover"
          onError={() => setImageError(true)}
        />
      ) : isVideo && objectUrl && !imageError ? (
        <video
          src={objectUrl}
          className="h-16 w-16 rounded-lg border border-border/60 object-cover"
          muted
          playsInline
          preload="metadata"
          onError={() => setImageError(true)}
        />
      ) : isPdf && objectUrl && !imageError ? (
        <embed
          src={objectUrl}
          type="application/pdf"
          className="h-20 w-16 rounded-lg border border-border/60 bg-background/80"
          onError={() => setImageError(true)}
        />
      ) : isText ? (
        <div className="flex h-20 w-16 items-center justify-center rounded-lg border border-border/60 bg-background/80 text-muted-foreground">
          <span className="text-[10px] font-semibold tracking-wide text-muted-foreground/80">
            TEXT
          </span>
        </div>
      ) : isAudio && objectUrl && !imageError ? (
        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border border-border/60 bg-background/80 text-muted-foreground">
          <ImageIcon className="h-5 w-5" />
          <span className="mt-1 text-[10px] font-semibold tracking-wide text-muted-foreground/80">
            AUDIO
          </span>
        </div>
      ) : (
        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border border-border/60 bg-background/80 text-muted-foreground">
          <ImageIcon className="h-5 w-5" />
          <span className="mt-1 text-[10px] font-semibold tracking-wide text-muted-foreground/80">
            {fileExt || "FILE"}
          </span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">
          {file.name}
        </div>
        <div className="text-xs text-muted-foreground">
          {(file.size / 1024).toFixed(1)}KB
        </div>
        {isText && textPreview && (
          <div className="mt-2 line-clamp-3 whitespace-pre-wrap rounded-md border border-border/60 bg-background/70 px-2 py-1 text-[11px] leading-snug text-muted-foreground">
            {textPreview}
          </div>
        )}
        {isAudio && objectUrl && !imageError && (
          <audio
            src={objectUrl}
            controls
            preload="metadata"
            className="mt-2 h-8 w-full"
            onError={() => setImageError(true)}
          />
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        title="Remove file"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

const IMAGE_ASPECT_OPTIONS: { value: string; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "1:1", label: "1:1" },
  { value: "7:3", label: "7:3" },
  { value: "4:1", label: "4:1" },
  { value: "21:9", label: "21:9" },
  { value: "16:9", label: "16:9" },
  { value: "5:3", label: "5:3" },
  { value: "5:4", label: "5:4" },
  { value: "4:3", label: "4:3" },
  { value: "3:2", label: "3:2" },
  { value: "9:7", label: "9:7" },
  { value: "9:16", label: "9:16" },
  { value: "4:5", label: "4:5" },
  { value: "2:3", label: "2:3" },
  { value: "3:4", label: "3:4" },
  { value: "1:2", label: "1:2" },
  { value: "1:4", label: "1:4" },
  { value: "1:9", label: "1:9" },
  { value: "3:7", label: "3:7" },
  { value: "9:21", label: "9:21" },
];

const IMAGE_SIZE_OPTIONS: { value: string; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "256x256", label: "256×256" },
  { value: "512x512", label: "512×512" },
  { value: "768x768", label: "768×768" },
  { value: "1024x768", label: "1024×768" },
  { value: "1024x1024", label: "1024×1024" },
  { value: "1536x1024", label: "1536×1024" },
  { value: "1024x1536", label: "1024×1536" },
  { value: "1792x1024", label: "1792×1024" },
  { value: "1024x1792", label: "1024×1792" },
  { value: "1365x1024", label: "1365×1024" },
  { value: "1024x1365", label: "1024×1365" },
  { value: "1820x1024", label: "1820×1024" },
  { value: "1024x1820", label: "1024×1820" },
  { value: "2048x1024", label: "2048×1024" },
  { value: "1024x2048", label: "1024×2048" },
  { value: "1707x1024", label: "1707×1024" },
  { value: "1024x1707", label: "1024×1707" },
  { value: "1434x1024", label: "1434×1024" },
  { value: "1024x1434", label: "1024×1434" },
  { value: "1280x1024", label: "1280×1024" },
  { value: "1024x1280", label: "1024×1280" },
  { value: "640x1536", label: "640×1536" },
  { value: "768x1344", label: "768×1344" },
  { value: "832x1216", label: "832×1216" },
  { value: "896x1152", label: "896×1152" },
  { value: "1152x896", label: "1152×896" },
  { value: "1216x832", label: "1216×832" },
  { value: "1344x768", label: "1344×768" },
  { value: "1536x640", label: "1536×640" },
];

const IMAGE_ASPECT_VALUES = new Set(IMAGE_ASPECT_OPTIONS.map((o) => o.value));
const IMAGE_SIZE_VALUES = new Set(
  IMAGE_SIZE_OPTIONS.map((o) => o.value).filter((v) => v !== "default"),
);
const OPENAI_SUPPORTED_SIZES = new Set(["1024x1024", "1536x1024", "1024x1536"]);
const OPENAI_SUPPORTED_ASPECTS = new Set([
  "auto",
  "1:1",
  "21:9",
  "16:9",
  "5:4",
  "4:3",
  "3:2",
  "9:16",
  "4:5",
  "2:3",
  "3:4",
  "9:21",
  "1:9",
  "7:3",
  "3:7",
]);
const GOOGLE_SUPPORTED_ASPECTS = new Set(["auto", "1:1", "3:4", "4:3", "9:16", "16:9"]);

function getSupportedImageOptions(modelId?: string) {
  if (!modelId) {
    return {
      aspectRatios: new Set<string>(["auto"]),
      sizes: new Set<string>([]),
    };
  }

  // OpenAI image_generation tool options (AI SDK OpenAI tool contract).
  if (modelId.startsWith("openai/")) {
    return {
      aspectRatios: OPENAI_SUPPORTED_ASPECTS,
      sizes: OPENAI_SUPPORTED_SIZES,
    };
  }

  // Google Gemini/Imagen image generation ratios via AI SDK.
  if (modelId.startsWith("google/")) {
    return {
      aspectRatios: GOOGLE_SUPPORTED_ASPECTS,
      sizes: new Set<string>([]),
    };
  }

  return {
    aspectRatios: new Set<string>(["auto"]),
    sizes: new Set<string>([]),
  };
}

export function ChatInput({
  onSend,
  isLoading,
  disabled,
  onStop,
  model,
  onModelChange,
  webSearchEnabled = false,
  onWebSearchToggle,
  imageAspectRatio = "auto",
  imageSize = null,
  onImageAspectRatioChange,
  onImageSizeChange,
}: ChatInputProps & {
  webSearchEnabled?: boolean;
  onWebSearchToggle?: () => void;
  imageAspectRatio?: string;
  imageSize?: string | null;
  onImageAspectRatioChange?: (value: string) => void;
  onImageSizeChange?: (value: string | null) => void;
}) {
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [preferredSpeechLanguage, setPreferredSpeechLanguage] = useState(() =>
    getSavedSpeechLanguage(),
  );
  const [activeRecognitionLanguage, setActiveRecognitionLanguage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const languageRotateTimerRef = useRef<number | null>(null);
  const keepListeningRef = useRef(false);
  const languageCandidatesRef = useRef<string[]>([]);
  const languageIndexRef = useRef(0);
  const hasFinalResultRef = useRef(false);
  const hasConfidenceScoreRef = useRef(false);
  const bestConfidenceRef = useRef(0);
  const finalTranscriptCharsRef = useRef(0);
  const forceAdvanceLanguageRef = useRef(false);
  const speechBaseTextRef = useRef("");
  const speechFinalTextRef = useRef("");
  const { getCapabilities, isPremium } = useModelCapabilities();
  const isPro = useIsProPlan();
  const speechSupported = useMemo(
    () => getSpeechRecognitionConstructor() !== null,
    [],
  );

  const clearLanguageRotateTimer = useCallback(() => {
    if (languageRotateTimerRef.current !== null) {
      window.clearTimeout(languageRotateTimerRef.current);
      languageRotateTimerRef.current = null;
    }
  }, []);

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    onSend(inputValue, attachedFiles.length > 0 ? attachedFiles : undefined);
    setInputValue("");
    setAttachedFiles([]);
    if (isListening) {
      keepListeningRef.current = false;
      clearLanguageRotateTimer();
      recognitionRef.current?.stop();
      setIsListening(false);
      setActiveRecognitionLanguage(null);
    }
  };

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === SPEECH_LANGUAGE_STORAGE_KEY) {
        setPreferredSpeechLanguage(getSavedSpeechLanguage());
      }
    };

    const handleLanguageChange = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setPreferredSpeechLanguage(customEvent.detail || getSavedSpeechLanguage());
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(
      SPEECH_LANGUAGE_CHANGED_EVENT,
      handleLanguageChange as EventListener,
    );
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        SPEECH_LANGUAGE_CHANGED_EVENT,
        handleLanguageChange as EventListener,
      );
    };
  }, []);

  const stopListening = useCallback(() => {
    keepListeningRef.current = false;
    clearLanguageRotateTimer();
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    forceAdvanceLanguageRef.current = false;
    setIsListening(false);
    setActiveRecognitionLanguage(null);
  }, [clearLanguageRotateTimer]);

  const shouldKeepCurrentLanguage = useCallback(() => {
    if (!hasFinalResultRef.current) return false;
    if (hasConfidenceScoreRef.current) {
      return bestConfidenceRef.current >= MIN_CONFIDENCE_TO_LOCK_LANGUAGE;
    }
    return (
      finalTranscriptCharsRef.current >=
      MIN_TRANSCRIPT_CHARS_TO_LOCK_WITHOUT_CONFIDENCE
    );
  }, []);

  const startRecognitionWithLanguage = useCallback(
    function runRecognition(languageIndex: number) {
      const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
      if (!SpeechRecognitionCtor) {
        toast.error("Speech recognition is not supported in this browser.");
        stopListening();
        return;
      }

      const languages = languageCandidatesRef.current;
      const language =
        languages[languageIndex] ||
        (typeof navigator !== "undefined" ? navigator.language : "en-US");

      hasFinalResultRef.current = false;
      hasConfidenceScoreRef.current = false;
      bestConfidenceRef.current = 0;
      finalTranscriptCharsRef.current = 0;
      forceAdvanceLanguageRef.current = false;
      clearLanguageRotateTimer();

      try {
        const recognition = new SpeechRecognitionCtor();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 3;
        recognition.lang = language;
        languageIndexRef.current = languageIndex;
        setActiveRecognitionLanguage(language);

        recognition.onresult = (event) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const result = event.results[i];
            const alternative = result[0];
            const transcript = alternative?.transcript?.trim();
            if (!transcript) continue;

            if (result.isFinal) {
              speechFinalTextRef.current = `${speechFinalTextRef.current} ${transcript}`.trim();
              hasFinalResultRef.current = true;
              finalTranscriptCharsRef.current += transcript.length;
              if (
                typeof alternative.confidence === "number" &&
                Number.isFinite(alternative.confidence) &&
                alternative.confidence > 0
              ) {
                hasConfidenceScoreRef.current = true;
                bestConfidenceRef.current = Math.max(
                  bestConfidenceRef.current,
                  alternative.confidence,
                );
              }
            } else {
              interim = `${interim} ${transcript}`.trim();
            }
          }

          const combinedTranscript = `${speechFinalTextRef.current} ${interim}`.trim();
          setInputValue(mergeSpeechText(speechBaseTextRef.current, combinedTranscript));
        };

        recognition.onerror = (event) => {
          const code = event.error ?? "unknown";
          if (code === "aborted") return;
          if (code === "not-allowed" || code === "service-not-allowed") {
            toast.error("Microphone permission denied.");
            stopListening();
            return;
          }
          if (code === "no-speech") {
            forceAdvanceLanguageRef.current =
              languageIndexRef.current < languageCandidatesRef.current.length - 1;
            return;
          }
          toast.error("Voice input failed. Please try again.");
        };

        recognition.onend = () => {
          clearLanguageRotateTimer();
          recognitionRef.current = null;
          if (!keepListeningRef.current) {
            setIsListening(false);
            setActiveRecognitionLanguage(null);
            return;
          }

          const hasNextLanguage =
            languageIndexRef.current < languageCandidatesRef.current.length - 1;
          const shouldAdvanceLanguage =
            hasNextLanguage &&
            (forceAdvanceLanguageRef.current || !shouldKeepCurrentLanguage());
          const nextIndex =
            shouldAdvanceLanguage
              ? languageIndexRef.current + 1
              : languageIndexRef.current;
          forceAdvanceLanguageRef.current = false;
          void runRecognition(nextIndex);
        };

        languageRotateTimerRef.current = window.setTimeout(() => {
          if (!keepListeningRef.current) return;
          if (recognitionRef.current !== recognition) return;
          if (languageIndexRef.current >= languageCandidatesRef.current.length - 1) return;
          if (shouldKeepCurrentLanguage()) return;
          forceAdvanceLanguageRef.current = true;
          recognition.stop();
        }, LANGUAGE_ROTATE_INTERVAL_MS);

        recognition.start();
      } catch {
        toast.error("Could not start voice recognition.");
        stopListening();
      }
    },
    [clearLanguageRotateTimer, setInputValue, shouldKeepCurrentLanguage, stopListening],
  );

  const toggleListening = useCallback(() => {
    if (!speechSupported) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    keepListeningRef.current = true;
    speechBaseTextRef.current = inputValue;
    speechFinalTextRef.current = "";
    hasFinalResultRef.current = false;
    hasConfidenceScoreRef.current = false;
    bestConfidenceRef.current = 0;
    finalTranscriptCharsRef.current = 0;
    forceAdvanceLanguageRef.current = false;
    languageCandidatesRef.current = buildSpeechLanguageCandidates(preferredSpeechLanguage);
    languageIndexRef.current = 0;
    setIsListening(true);
    void startRecognitionWithLanguage(0);
  }, [
    inputValue,
    isListening,
    preferredSpeechLanguage,
    speechSupported,
    startRecognitionWithLanguage,
    stopListening,
  ]);

  useEffect(() => {
    return () => {
      keepListeningRef.current = false;
      clearLanguageRotateTimer();
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, [clearLanguageRotateTimer]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const validFiles: File[] = [];
      let rejectedCount = 0;
      for (const file of files) {
        const error = validateFile(file);
        if (error) {
          rejectedCount += 1;
          toast.error(`${file.name}: ${error}`);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        setAttachedFiles((prev) => [...prev, ...validFiles]);
      }
      if (rejectedCount > 0 && validFiles.length === 0) {
        toast.error("No files were attached.");
      }

      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [],
  );

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeFile = useCallback((index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Group models by provider for the selector
  const groupedModels = AVAILABLE_MODELS.reduce(
    (acc, m) => {
      if (!acc[m.provider]) acc[m.provider] = [];
      acc[m.provider].push(m);
      return acc;
    },
    {} as Record<string, typeof AVAILABLE_MODELS>,
  );

  const selectedModelData = AVAILABLE_MODELS.find((m) => m.id === model);
  const canSearch =
    !!selectedModelData &&
    getCapabilities(selectedModelData.id).includes("web-search");
  const canGenerateImage =
    !!selectedModelData &&
    getCapabilities(selectedModelData.id).includes("image-generation");
  const supportedImageOptions =
    selectedModelData && canGenerateImage
      ? getSupportedImageOptions(selectedModelData.id)
      : getSupportedImageOptions(undefined);
  const supportedAspectRatios = supportedImageOptions.aspectRatios;
  const supportedSizes = supportedImageOptions.sizes;

  return (
    <div className="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-lg supports-backdrop-filter:bg-background/70 backdrop-blur">
      <PromptInputProvider>
        <PromptInput
          onSubmit={handleSubmit}
          isLoading={isLoading}
          disabled={disabled}
          value={inputValue}
          onValueChange={setInputValue}
        >
          <PromptInputBody>
            <PromptInputTextarea ref={textareaRef} />
            {isListening && (
              <div className="mt-2 px-1 text-xs text-primary/90">
                Listening... {activeRecognitionLanguage ? `(${activeRecognitionLanguage})` : ""}
              </div>
            )}
            {attachedFiles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3 px-1">
                {attachedFiles.map((file, index) => (
                  <AttachmentPreview
                    key={`${file.name}-${index}`}
                    file={file}
                    onRemove={() => removeFile(index)}
                  />
                ))}
              </div>
            )}
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <ModelSelector
                open={modelSelectorOpen}
                onOpenChange={setModelSelectorOpen}
              >
                <ModelSelectorTrigger asChild>
                  <PromptInputButton>
                    {selectedModelData && (
                      <>
                        <ModelSelectorLogo
                          provider={selectedModelData.provider}
                        />
                        <ModelSelectorName>
                          {selectedModelData.name}
                        </ModelSelectorName>
                        {isPremium(selectedModelData.id) && (
                          <PremiumModelBadge className="ml-1" />
                        )}
                        <ModelCapabilityIcons
                          className="ml-1 hidden md:flex"
                          capabilities={getCapabilities(selectedModelData.id)}
                        />
                      </>
                    )}
                  </PromptInputButton>
                </ModelSelectorTrigger>
                <ModelSelectorContent>
                  <ModelSelectorInput placeholder="Search models..." />
                  <ModelSelectorList>
                    <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                    {Object.entries(groupedModels).map(([provider, models]) => (
                      <ModelSelectorGroup key={provider}>
                        <div className="px-2 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {provider}
                        </div>
                        {models.map((m) =>
                          (() => {
                            const premium = isPremium(m.id);
                            const disabledByPlan = premium && !isPro;

                            return (
                              <ModelSelectorItem
                                key={m.id}
                                disabled={disabledByPlan}
                                onSelect={() => {
                                  if (disabledByPlan) return;
                                  onModelChange(m.id);
                                  setModelSelectorOpen(false);
                                }}
                                value={m.name}
                              >
                                <ModelSelectorLogo provider={m.provider} />
                                <ModelSelectorName>{m.name}</ModelSelectorName>
                                {premium && <PremiumModelBadge />}
                                <ModelCapabilityIcons
                                  className="mr-2 hidden md:flex"
                                  capabilities={getCapabilities(m.id)}
                                />
                                {model === m.id && (
                                  <CheckIcon className="ml-auto size-4" />
                                )}
                              </ModelSelectorItem>
                            );
                          })(),
                        )}
                      </ModelSelectorGroup>
                    ))}
                  </ModelSelectorList>
                </ModelSelectorContent>
              </ModelSelector>
              <PromptInputButton
                type="button"
                onClick={() => {
                  if (!onWebSearchToggle) return;
                  onWebSearchToggle();
                }}
                className={
                  webSearchEnabled
                    ? "bg-primary/10 text-primary hover:bg-primary/15"
                    : "text-muted-foreground/70 hover:text-muted-foreground"
                }
                title={
                  webSearchEnabled
                    ? "Web search enabled"
                    : canSearch
                      ? "Enable web search"
                      : "Enable web search (model support checked server-side)"
                }
              >
                <CiGlobe className="h-4 w-4" />
              </PromptInputButton>
              <PromptInputButton
                type="button"
                onClick={handleAttachClick}
                className="text-muted-foreground hover:text-foreground"
                title="Attach files"
              >
                <FaPaperclip className="h-3.5 w-3.5" />
              </PromptInputButton>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,text/*,application/json,application/xml,application/x-yaml,text/xml,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/ogg,audio/webm,audio/flac"
                onChange={handleFileSelect}
                className="hidden"
              />
              {canGenerateImage && onImageAspectRatioChange && (
                <div className="flex items-center gap-1 border-l border-border/60 pl-1">
                  <ImageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <Select
                    value={imageSize ?? (imageAspectRatio || "auto")}
                    onValueChange={(v) => {
                      if (v === "default" || v === "") {
                        onImageSizeChange?.(null);
                        onImageAspectRatioChange("auto");
                      } else if (IMAGE_SIZE_VALUES.has(v)) {
                        onImageSizeChange?.(v);
                        onImageAspectRatioChange("auto");
                      } else if (IMAGE_ASPECT_VALUES.has(v)) {
                        onImageSizeChange?.(null);
                        onImageAspectRatioChange(v);
                      } else {
                        onImageSizeChange?.(null);
                        onImageAspectRatioChange("auto");
                      }
                    }}
                  >
                    <SelectTrigger
                      className="h-8 min-w-[5rem] w-fit border border-input text-xs text-muted-foreground"
                      title="Image aspect / size"
                    >
                      <SelectValue placeholder="Aspect" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {IMAGE_ASPECT_OPTIONS.map((o) => (
                          <SelectItem
                            key={o.value}
                            value={o.value}
                            disabled={!supportedAspectRatios.has(o.value)}
                          >
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Size</SelectLabel>
                        {IMAGE_SIZE_OPTIONS.map((o) => (
                          <SelectItem
                            key={o.value}
                            value={o.value}
                            disabled={o.value !== "default" && !supportedSizes.has(o.value)}
                          >
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </PromptInputTools>
            <div className="flex items-center gap-1">
              <PromptInputButton
                type="button"
                onClick={toggleListening}
                className={cn(
                  "text-muted-foreground transition-colors",
                  isListening
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "hover:text-foreground",
                )}
                title={
                  isListening
                    ? "Stop voice input"
                    : speechSupported
                      ? "Start voice input"
                      : "Speech recognition is not supported in this browser"
                }
                disabled={!speechSupported}
              >
                <IoMicOutline className="h-4 w-4" />
              </PromptInputButton>
              <PromptInputSubmit onStop={onStop} />
            </div>
          </PromptInputFooter>
        </PromptInput>
      </PromptInputProvider>
    </div>
  );
}
