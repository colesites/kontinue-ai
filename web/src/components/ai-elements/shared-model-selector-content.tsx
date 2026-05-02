import { useState, useMemo } from "react";
import { CheckIcon, LayoutGridIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  ModelSelectorInput,
  ModelSelectorList,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorItem,
  ModelSelectorLogo,
  ModelSelectorName,
} from "./model-selector";
import { PremiumModelBadge } from "./premium-model-badge";
import { ModelCapabilityIcons } from "./model-capability-icons";
import { AVAILABLE_MODELS } from "../../lib/models";
import { useModelCapabilities } from "../../lib/use-model-capabilities";
import { useIsProPlan } from "../../lib/use-plan-tier";

export function SharedModelSelectorContent({
  selectedModelId,
  onModelSelect,
  modelIdsFilter,
}: {
  selectedModelId?: string;
  onModelSelect: (id: string) => void;
  modelIdsFilter?: string[];
}) {
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const { getCapabilities, isPremium } = useModelCapabilities();
  const isPro = useIsProPlan();

  const modelsToDisplay = useMemo(() => {
    if (modelIdsFilter) {
      return AVAILABLE_MODELS.filter((m) => modelIdsFilter.includes(m.id));
    }
    return AVAILABLE_MODELS;
  }, [modelIdsFilter]);

  const groupedModels = useMemo(() => {
    return modelsToDisplay.reduce(
      (acc, m) => {
        if (!acc[m.provider]) acc[m.provider] = [];
        acc[m.provider].push(m);
        return acc;
      },
      {} as Record<string, typeof AVAILABLE_MODELS>,
    );
  }, [modelsToDisplay]);

  const providers = Object.keys(groupedModels);

  return (
    <div className="flex h-full w-full flex-row overflow-hidden bg-background">
      {/* Sidebar for providers */}
      <div className="flex w-[68px] sm:w-56 flex-col border-r border-border bg-muted/20 shrink-0">
        <div className="p-4 border-b border-border h-14 flex items-center justify-center sm:justify-start">
          <h3 className="text-sm font-semibold text-foreground hidden sm:block">Providers</h3>
          <LayoutGridIcon className="size-5 sm:hidden text-foreground opacity-80" />
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0 touch-pan-y">
          <button
            className={cn(
              "w-full flex items-center justify-center sm:justify-start gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors",
              activeProvider === null
                ? "bg-accent text-accent-foreground font-medium shadow-sm"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
            onClick={() => setActiveProvider(null)}
            title="All Models"
          >
            <LayoutGridIcon className="size-5 sm:hidden opacity-80 shrink-0" />
            <span className="hidden sm:inline">All Models</span>
          </button>
          {providers.map((provider) => (
            <button
              key={provider}
              className={cn(
                "w-full flex items-center justify-center sm:justify-start gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors",
                activeProvider === provider
                  ? "bg-accent text-accent-foreground font-medium shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
              onClick={() => setActiveProvider(provider)}
              title={provider}
            >
              <ModelSelectorLogo
                provider={provider}
                className="size-5 sm:size-4 opacity-80 shrink-0"
              />
              <span className="capitalize hidden sm:inline truncate">{provider}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background min-h-0">
        <ModelSelectorInput
          placeholder="Search models..."
          className="border-0 border-b border-border h-14 bg-transparent shrink-0"
        />
        <ModelSelectorList className="flex-1 min-h-0 p-3 h-full max-h-none overflow-y-auto touch-pan-y scroll-smooth">
          <ModelSelectorEmpty className="py-12">
            No models found.
          </ModelSelectorEmpty>
          {(activeProvider ? [activeProvider] : providers).map((provider) => (
            <ModelSelectorGroup key={provider}>
              {!activeProvider && (
                <div className="px-1 pt-4 pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-2">
                  <ModelSelectorLogo
                    provider={provider}
                    className="size-3.5 opacity-60 dark:invert"
                  />
                  {provider}
                </div>
              )}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 pb-4">
                {groupedModels[provider].map((m) => {
                  const premium = isPremium(m.id);
                  const disabledByPlan = premium && !isPro;
                  const isSelected = selectedModelId === m.id;

                  return (
                    <ModelSelectorItem
                      key={m.id}
                      disabled={disabledByPlan}
                      onSelect={() => {
                        if (disabledByPlan) return;
                        onModelSelect(m.id);
                      }}
                      value={m.name}
                      className={cn(
                        "flex flex-col items-start gap-2.5 p-3.5 rounded-xl border transition-all cursor-pointer",
                        "data-[selected=true]:bg-accent/40 data-[selected=true]:border-border/60",
                        isSelected
                          ? "bg-accent/50 border-border ring-1 ring-primary/20 shadow-sm"
                          : "border-transparent hover:border-border/40",
                        disabledByPlan && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="p-1.5 rounded-md bg-background border border-border/50 shadow-sm">
                            <ModelSelectorLogo
                              provider={m.provider}
                              className="shrink-0 size-4"
                            />
                          </div>
                          <ModelSelectorName className="text-[15px] font-semibold truncate text-foreground">
                            {m.name}
                          </ModelSelectorName>
                          {premium && (
                            <PremiumModelBadge className="shrink-0 scale-90 origin-left" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <ModelCapabilityIcons
                            className="hidden lg:flex opacity-80"
                            capabilities={getCapabilities(m.id)}
                          />
                          {isSelected && (
                            <div className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary">
                              <CheckIcon className="size-3.5" />
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed pl-[34px]">
                        {m.description || "A powerful AI model."}
                      </p>
                    </ModelSelectorItem>
                  );
                })}
              </div>
            </ModelSelectorGroup>
          ))}
        </ModelSelectorList>
      </div>
    </div>
  );
}
