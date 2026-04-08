"use client";

import { useEffect, useMemo, useState } from "react";
import {
  deriveCapabilities,
  deriveIsPremium,
  fetchAiGatewayModels,
  type ModelCapability,
} from "./model-capabilities";
import { ALWAYS_FREE_MODEL_IDS } from "./models";

export function useModelCapabilities() {
  const [capabilitiesById, setCapabilitiesById] = useState<
    Record<string, ModelCapability[]>
  >({});
  const [premiumById, setPremiumById] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const models = await fetchAiGatewayModels();
        if (cancelled) return;

        const next: Record<string, ModelCapability[]> = {};
        const nextPremium: Record<string, boolean> = {};
        for (const m of models) {
          next[m.id] = deriveCapabilities(m);
          nextPremium[m.id] = deriveIsPremium(m);
        }
        setCapabilitiesById(next);
        setPremiumById(nextPremium);
      } catch {
        if (cancelled) return;
        setCapabilitiesById({});
        setPremiumById({});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(
    () => ({
      getCapabilities: (modelId: string) => capabilitiesById[modelId] ?? [],
      isPremium: (modelId: string) =>
        ALWAYS_FREE_MODEL_IDS.has(modelId)
          ? false
          : premiumById[modelId] ?? true,
      capabilitiesById,
      premiumById,
    }),
    [capabilitiesById, premiumById]
  );
}
