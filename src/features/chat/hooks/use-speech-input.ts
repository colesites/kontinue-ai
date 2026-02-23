import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  type SpeechRecognitionInstance,
  getSpeechRecognitionConstructor,
  buildSpeechLanguageCandidates,
  mergeSpeechText,
  LANGUAGE_ROTATE_INTERVAL_MS,
  MIN_CONFIDENCE_TO_LOCK_LANGUAGE,
  MIN_TRANSCRIPT_CHARS_TO_LOCK_WITHOUT_CONFIDENCE,
} from "../lib/speech-recognition";
import {
  getSavedSpeechLanguage,
  SPEECH_AUTO_LANGUAGE,
  SPEECH_LANGUAGE_CHANGED_EVENT,
  SPEECH_LANGUAGE_STORAGE_KEY,
} from "@/lib/speech-settings";

export function useSpeechInput({
  inputValue,
  setInputValue,
}: {
  inputValue: string;
  setInputValue: (value: string) => void;
}) {
  const [isListening, setIsListening] = useState(false);
  const [activeRecognitionLanguage, setActiveRecognitionLanguage] = useState<
    string | null
  >(null);
  const [preferredSpeechLanguage, setPreferredSpeechLanguage] = useState(() =>
    getSavedSpeechLanguage(),
  );

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const languageRotateTimerRef = useRef<number | null>(null);
  const autoDetectModeRef = useRef(false);
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

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === SPEECH_LANGUAGE_STORAGE_KEY) {
        setPreferredSpeechLanguage(getSavedSpeechLanguage());
      }
    };

    const handleLanguageChange = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setPreferredSpeechLanguage(
        customEvent.detail || getSavedSpeechLanguage(),
      );
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
    autoDetectModeRef.current = false;
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
              speechFinalTextRef.current =
                `${speechFinalTextRef.current} ${transcript}`.trim();
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

          const combinedTranscript =
            `${speechFinalTextRef.current} ${interim}`.trim();
          setInputValue(
            mergeSpeechText(speechBaseTextRef.current, combinedTranscript),
          );
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
              autoDetectModeRef.current &&
              languageIndexRef.current <
                languageCandidatesRef.current.length - 1;
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
            autoDetectModeRef.current &&
            languageIndexRef.current < languageCandidatesRef.current.length - 1;
          const shouldAdvanceLanguage =
            hasNextLanguage &&
            (forceAdvanceLanguageRef.current || !shouldKeepCurrentLanguage());
          const nextIndex = shouldAdvanceLanguage
            ? languageIndexRef.current + 1
            : languageIndexRef.current;
          forceAdvanceLanguageRef.current = false;
          void runRecognition(nextIndex);
        };

        if (autoDetectModeRef.current) {
          languageRotateTimerRef.current = window.setTimeout(() => {
            if (!keepListeningRef.current) return;
            if (recognitionRef.current !== recognition) return;
            if (
              languageIndexRef.current >=
              languageCandidatesRef.current.length - 1
            )
              return;
            if (shouldKeepCurrentLanguage()) return;
            forceAdvanceLanguageRef.current = true;
            recognition.stop();
          }, LANGUAGE_ROTATE_INTERVAL_MS);
        }

        recognition.start();
      } catch {
        toast.error("Could not start voice recognition.");
        stopListening();
      }
    },
    [
      clearLanguageRotateTimer,
      setInputValue,
      shouldKeepCurrentLanguage,
      stopListening,
    ],
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
    autoDetectModeRef.current =
      preferredSpeechLanguage === SPEECH_AUTO_LANGUAGE;
    languageCandidatesRef.current = buildSpeechLanguageCandidates(
      preferredSpeechLanguage,
    );
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

  return {
    isListening,
    activeRecognitionLanguage,
    speechSupported,
    toggleListening,
    stopListening,
  };
}
