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
import { PremiumModelBadge } from "@/components/ai-elements/premium-model-badge";
import { ModelCapabilityIcons } from "@/components/ai-elements/model-capability-icons";
import { PromptInputButton } from "@/components/ai-elements/prompt-input";
import { CheckIcon } from "lucide-react";
import { AVAILABLE_MODELS } from "@/lib/models";
import { useModelCapabilities } from "@/lib/use-model-capabilities";
import { useIsProPlan } from "@/lib/use-plan-tier";

type ChatInputModelSelectorProps = {
  model: string;
  onModelChange: (model: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChatInputModelSelector({
  model,
  onModelChange,
  open,
  onOpenChange,
}: ChatInputModelSelectorProps) {
  const { getCapabilities, isPremium } = useModelCapabilities();
  const isPro = useIsProPlan();

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
    <ModelSelector open={open} onOpenChange={onOpenChange}>
      <ModelSelectorTrigger asChild>
        <PromptInputButton>
          {selectedModelData && (
            <>
              <ModelSelectorLogo provider={selectedModelData.provider} />
              <ModelSelectorName>{selectedModelData.name}</ModelSelectorName>
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
              {models.map((m) => {
                const premium = isPremium(m.id);
                const disabledByPlan = premium && !isPro;

                return (
                  <ModelSelectorItem
                    key={m.id}
                    disabled={disabledByPlan}
                    onSelect={() => {
                      if (disabledByPlan) return;
                      onModelChange(m.id);
                      onOpenChange(false);
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
              })}
            </ModelSelectorGroup>
          ))}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}
