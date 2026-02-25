import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useIsProPlan } from "@/lib/use-plan-tier";
import {
  AVAILABLE_MODELS,
  getDefaultModelForPlan,
  getModelById,
} from "@/lib/models";
import { useModelCapabilities } from "@/lib/use-model-capabilities";
import { consumePendingChatDraft } from "@/lib/pending-chat-draft";

export function useChatState({ chatId }: { chatId: Id<"chats"> }) {
  const isPaidPlan = useIsProPlan();
  const { isPremium } = useModelCapabilities();
  const persistedDefaultModel = useQuery(api.users.getDefaultModel, {});
  const saveDefaultModel = useMutation(api.users.setDefaultModel);

  const [localSelectedModel, setLocalSelectedModel] = useState<string | null>(
    null,
  );
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<string>("auto");
  const [imageSize, setImageSize] = useState<string | null>(null);

  const hasConsumedPendingDraftRef = useRef(false);
  const validatedPersistedModel =
    persistedDefaultModel && getModelById(persistedDefaultModel)
      ? persistedDefaultModel
      : null;

  const setUserSelectedModel = useCallback(
    (modelId: string | null) => {
      setLocalSelectedModel(modelId);
      if (!modelId || !getModelById(modelId)) return;

      void saveDefaultModel({ modelId }).catch((error) => {
        console.error("Failed to persist selected model:", error);
      });
    },
    [saveDefaultModel],
  );

  const selectedModel = useMemo(
    () =>
      localSelectedModel ??
      validatedPersistedModel ??
      getDefaultModelForPlan(isPaidPlan).id,
    [localSelectedModel, validatedPersistedModel, isPaidPlan],
  );

  const modelOptionsByProvider = useMemo(() => {
    return AVAILABLE_MODELS.reduce<Record<string, typeof AVAILABLE_MODELS>>(
      (acc, model) => {
        if (!acc[model.provider]) acc[model.provider] = [];
        acc[model.provider].push(model);
        return acc;
      },
      {},
    );
  }, []);

  const modelOptionsWithAccess = useMemo(() => {
    const next: Record<
      string,
      Array<{ id: string; name: string; provider: string; disabled?: boolean }>
    > = {};

    for (const [provider, models] of Object.entries(modelOptionsByProvider)) {
      next[provider] = models.map((model) => ({
        id: model.id,
        name: model.name,
        provider: model.provider,
        disabled: isPremium(model.id) && !isPaidPlan,
      }));
    }

    return next;
  }, [modelOptionsByProvider, isPremium, isPaidPlan]);

  const consumeDraft = (onSend: (text: string) => void) => {
    if (hasConsumedPendingDraftRef.current) return;
    hasConsumedPendingDraftRef.current = true;

    const draft = consumePendingChatDraft(String(chatId));
    if (!draft?.text?.trim()) return;

    if (draft.model && getModelById(draft.model)) {
      setUserSelectedModel(draft.model);
    }
    if (typeof draft.webSearchEnabled === "boolean") {
      setWebSearchEnabled(isPaidPlan ? draft.webSearchEnabled : false);
    }
    if (draft.imageAspectRatio) {
      setImageAspectRatio(draft.imageAspectRatio);
    }
    if ("imageSize" in draft) {
      setImageSize(draft.imageSize ?? null);
    }

    onSend(draft.text);
  };

  return {
    selectedModel,
    userSelectedModel: localSelectedModel ?? validatedPersistedModel,
    setUserSelectedModel,
    webSearchEnabled: isPaidPlan ? webSearchEnabled : false,
    setWebSearchEnabled,
    imageAspectRatio,
    setImageAspectRatio,
    imageSize,
    setImageSize,
    modelOptionsWithAccess,
    consumeDraft,
  };
}
