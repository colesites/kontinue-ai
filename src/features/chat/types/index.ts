interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  isLoading?: boolean;
  disabled?: boolean;
  model: string;
  onModelChange: (modelId: string) => void;
  webSearchEnabled?: boolean;
  onWebSearchToggle?: () => void;
  imageAspectRatio?: string;
  imageSize?: string | null;
  onImageAspectRatioChange?: (value: string) => void;
  onImageSizeChange?: (value: string | null) => void;
}

interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  /** Data URLs or http(s) URLs for generated/attached images */
  imageParts?: string[];
  isImported?: boolean;
  isStreaming?: boolean;
}

interface ImportedContextProps {
  provider: string;
  sourceUrl?: string;
  importedAt: number;
  messageCount: number;
}

export type { ChatInputProps, ChatMessageProps, ImportedContextProps };
