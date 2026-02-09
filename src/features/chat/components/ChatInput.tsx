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
import { CheckIcon } from "lucide-react";
import { useRef, useState } from "react";
import { AVAILABLE_MODELS } from "@/lib/models";
import { useModelCapabilities } from "@/lib/use-model-capabilities";
import { ModelCapabilityIcons } from "@/components/ai-elements/model-capability-icons";
import { useIsProPlan } from "@/lib/use-is-pro-plan";
import { PremiumModelBadge } from "@/components/ai-elements/premium-model-badge";
import type { ChatInputProps } from "@/features/chat/types";

export function ChatInput({
  onSend,
  isLoading,
  disabled,
  model,
  onModelChange,
}: ChatInputProps) {
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { getCapabilities, isPremium } = useModelCapabilities();
  const isPro = useIsProPlan();

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    onSend(inputValue);
    setInputValue("");
  };

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
                          className="ml-1"
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
                      <ModelSelectorGroup heading={provider} key={provider}>
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
                                  className="mr-2"
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
            </PromptInputTools>
            <PromptInputSubmit />
          </PromptInputFooter>
        </PromptInput>
      </PromptInputProvider>

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Shift+Enter for new line</span>
        <span>Verify important info</span>
      </div>
    </div>
  );
}
