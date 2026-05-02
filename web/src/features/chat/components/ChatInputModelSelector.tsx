import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "../../../components/ai-elements/model-selector";
import { SharedModelSelectorContent } from "../../../components/ai-elements/shared-model-selector-content";
import { PremiumModelBadge } from "../../../components/ai-elements/premium-model-badge";
import { ModelCapabilityIcons } from "../../../components/ai-elements/model-capability-icons";
import { PromptInputButton } from "../../../components/ai-elements/prompt-input";
import { CheckIcon } from "lucide-react";
import { AVAILABLE_MODELS } from "../../../lib/models";
import { useModelCapabilities } from "../../../lib/use-model-capabilities";
import { useIsProPlan } from "../../../lib/use-plan-tier";

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
      <ModelSelectorContent className="sm:max-w-4xl h-[75vh] sm:h-[600px] p-0 flex flex-col overflow-hidden">
        <SharedModelSelectorContent
          selectedModelId={model}
          onModelSelect={(id) => {
            onModelChange(id);
            onOpenChange(false);
          }}
        />
      </ModelSelectorContent>
    </ModelSelector>
  );
}
