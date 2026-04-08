import { useState } from "react";
import { CheckIcon } from "lucide-react";
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
} from "../../../components/ai-elements/model-selector";
import { AVAILABLE_MODELS } from "../../../lib/models";
import { useModelCapabilities } from "../../../lib/use-model-capabilities";
import { ModelCapabilityIcons } from "../../../components/ai-elements/model-capability-icons";
import { useIsProPlan } from "../../../lib/use-plan-tier";
import { PremiumModelBadge } from "../../../components/ai-elements/premium-model-badge";

export function ModelSelectorWrapper({
  selectedModel,
  onModelChange,
  disabled,
}: {
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { getCapabilities, isPremium } = useModelCapabilities();
  const isPro = useIsProPlan();
  const selectedModelData = AVAILABLE_MODELS.find(
    (m) => m.id === selectedModel,
  );

  const groupedModels = AVAILABLE_MODELS.reduce(
    (acc, m) => {
      if (!acc[m.provider]) acc[m.provider] = [];
      acc[m.provider].push(m);
      return acc;
    },
    {} as Record<string, typeof AVAILABLE_MODELS>,
  );

  return (
    <ModelSelector open={open} onOpenChange={setOpen}>
      <ModelSelectorTrigger asChild>
        <button
          disabled={disabled}
          className="w-full sm:w-auto min-h-[56px] px-4 rounded-xl border border-input bg-background hover:bg-muted transition-colors flex items-center justify-center gap-2 group min-w-[140px]"
        >
          {selectedModelData && (
            <>
              <ModelSelectorLogo
                provider={selectedModelData.provider}
                className="size-4"
              />
              <span className="text-sm font-medium text-foreground truncate max-w-[80px]">
                {selectedModelData.name}
              </span>
              {isPremium(selectedModelData.id) && <PremiumModelBadge />}
              <ModelCapabilityIcons
                className="ml-1"
                capabilities={getCapabilities(selectedModelData.id)}
              />
            </>
          )}
        </button>
      </ModelSelectorTrigger>
      <ModelSelectorContent title="Select Model for Chat">
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
                        setOpen(false);
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
                      {selectedModel === m.id && (
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
  );
}
