"use client";

import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { persistedPlanForTier } from "../lib/plan-tier";
import type { PlanTier } from "../lib/plan-tier";

export function useSyncUserProfile(planTier: PlanTier): boolean {
  const { user, isLoaded } = useUser();
  const { isLoaded: isAuthLoaded } = useAuth();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);

  useEffect(() => {
    if (!isLoaded || !isAuthLoaded || !user) return;

    void getOrCreateUser({
      clerkUserId: user.id,
      email: user.primaryEmailAddress?.emailAddress ?? "",
      name: user.fullName ?? undefined,
      imageUrl: user.imageUrl ?? undefined,
      subscriptionStatus: planTier === "free" ? "inactive" : "active",
      plan: persistedPlanForTier(planTier),
    });
  }, [getOrCreateUser, isAuthLoaded, isLoaded, planTier, user]);

  return isLoaded;
}
