"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useIsProPlan(): boolean {
  const { user } = useUser();
  const { isLoaded: isAuthLoaded, has } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser, {});

  const isProFromClerkPlans =
    isAuthLoaded && typeof has === "function" ? has({ plan: "pro_plan" }) : false;

  type Entitlement = { key?: string; name?: string };
  type UserWithBilling = {
    entitlements?: Entitlement[];
    publicMetadata?: { plan?: string; subscriptionStatus?: string };
    unsafeMetadata?: { plan?: string; subscriptionStatus?: string };
  };

  const billingUser = user as unknown as UserWithBilling | null | undefined;
  const entitlements = billingUser?.entitlements ?? [];

  const planFromMetadata =
    billingUser?.publicMetadata?.plan ?? billingUser?.unsafeMetadata?.plan;
  const subscriptionStatusFromMetadata =
    billingUser?.publicMetadata?.subscriptionStatus ??
    billingUser?.unsafeMetadata?.subscriptionStatus;

  const isProFromClerkLegacy =
    planFromMetadata === "pro" ||
    subscriptionStatusFromMetadata === "active" ||
    entitlements.some((e) => e.key === "pro" || e.name === "Pro");

  return (
    isProFromClerkPlans || isProFromClerkLegacy || currentUser?.plan === "pro"
  );
}
