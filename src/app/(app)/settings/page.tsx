"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { ArrowLeft, ExternalLink, LogOut } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { api } from "../../../../convex/_generated/api";
import {
  getSavedSpeechLanguage,
  setSavedSpeechLanguage,
  SPEECH_LANGUAGE_OPTIONS,
  SPEECH_AUTO_LANGUAGE,
} from "@/lib/speech-settings";

type SettingsTab = "account" | "contact";

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useUser();
  const { isLoaded: isAuthLoaded, has } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const usage = useQuery(api.messages.getMonthlyUsage, {});
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() =>
    getSavedSpeechLanguage(),
  );

  const displayName =
    user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "Account";
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "Signed in user";
  const userInitial = (
    user?.firstName?.charAt(0) ??
    displayName.charAt(0) ??
    "U"
  ).toUpperCase();

  const isProFromClerkPlans =
    isAuthLoaded && typeof has === "function"
      ? has({ plan: "pro_plan" })
      : false;

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

  const isPro =
    isProFromClerkPlans || isProFromClerkLegacy || currentUser?.plan === "pro";

  const selectedLanguageLabel = useMemo(() => {
    const selected = SPEECH_LANGUAGE_OPTIONS.find(
      (option) => option.value === selectedLanguage,
    );
    return selected?.label ?? "Auto detect (Recommended)";
  }, [selectedLanguage]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </button>
          <SignOutButton>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </SignOutButton>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm">
              <div className="flex flex-col items-center text-center">
                {user?.imageUrl ? (
                  <span
                    className="h-28 w-28 rounded-full border border-border/70 bg-card/60 bg-cover bg-center"
                    style={{ backgroundImage: `url(${user.imageUrl})` }}
                  />
                ) : (
                  <span className="flex h-28 w-28 items-center justify-center rounded-full border border-border/70 bg-primary/10 text-4xl font-semibold text-primary">
                    {userInitial}
                  </span>
                )}
                <p className="mt-4 text-2xl font-semibold tracking-tight">
                  {displayName}
                </p>
                <p className="mt-1 max-w-full truncate text-sm text-muted-foreground">
                  {userEmail}
                </p>
                <span
                  className={`mt-3 inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${
                    isPro
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-border/70 bg-background/70 text-muted-foreground"
                  }`}
                >
                  {isPro ? "Pro Plan" : "Free Plan"}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm">
              <p className="text-sm font-medium text-foreground">
                Current plan
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isPro
                  ? "You have access to premium models and higher limits."
                  : "You are on the free plan. Upgrade when you need more limits."}
              </p>
              {!isPro && (
                <Link
                  href="/pricing"
                  className="mt-3 inline-flex rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  View pricing
                </Link>
              )}
            </div>
          </aside>

          <section className="rounded-2xl border border-border/70 bg-card/60 p-6 shadow-sm">
            <div className="mb-6">
              <div className="inline-flex rounded-xl border border-border/70 bg-background/60 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("account")}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    activeTab === "account"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Account
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("contact")}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    activeTab === "contact"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Contact Us
                </button>
              </div>
            </div>
            {activeTab === "account" ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Account
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Voice input language preferences for speech recognition.
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/70 p-5">
                  <p className="text-sm font-medium text-foreground">
                    Preferred Voice Language
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    When you choose a specific language, voice input listens
                    only in that language. Only Auto mode rotates across
                    languages.
                  </p>

                  <div className="mt-4 max-w-md">
                    <Select
                      value={selectedLanguage}
                      onValueChange={(value) => {
                        const saved = setSavedSpeechLanguage(value);
                        setSelectedLanguage(saved);
                      }}
                    >
                      <SelectTrigger className="h-10 w-full border-border/70 bg-background/80">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {SPEECH_LANGUAGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                            {option.nativeLabel
                              ? ` - ${option.nativeLabel}`
                              : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="mt-4 rounded-lg border border-border/60 bg-card/80 px-3 py-2 text-xs text-muted-foreground">
                    Current:{" "}
                    <span className="font-medium text-foreground">
                      {selectedLanguageLabel}
                    </span>
                    {selectedLanguage === SPEECH_AUTO_LANGUAGE
                      ? " (best multilingual behavior)"
                      : ""}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">
                      Monthly Usage
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Track your message consumption for the current month.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-background/70 p-5 space-y-6">
                    {usage ? (
                      <>
                        {!usage.isPro ? (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">
                                Free Model Messages
                              </span>
                              <span className="text-muted-foreground">
                                {usage.freeMonthlyUsed} /{" "}
                                {usage.freeMonthlyLimit}
                              </span>
                            </div>
                            <Progress
                              value={
                                (usage.freeMonthlyUsed /
                                  usage.freeMonthlyLimit) *
                                100
                              }
                              className="h-2"
                            />
                            <p className="text-[10px] text-muted-foreground">
                              Upgrade to Pro for higher limits and premium
                              models.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">
                                  Standard Model Messages
                                </span>
                                <span className="text-muted-foreground">
                                  {usage.proStandardUsed} /{" "}
                                  {usage.proStandardLimit}
                                </span>
                              </div>
                              <Progress
                                value={
                                  (usage.proStandardUsed /
                                    usage.proStandardLimit) *
                                  100
                                }
                                className="h-2"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">
                                  Premium Model Messages
                                </span>
                                <span className="text-muted-foreground">
                                  {usage.proPremiumUsed} /{" "}
                                  {usage.proPremiumLimit}
                                </span>
                              </div>
                              <Progress
                                value={
                                  (usage.proPremiumUsed /
                                    usage.proPremiumLimit) *
                                  100
                                }
                                className="h-2 shadow-[0_0_8px_rgba(var(--primary),0.2)]"
                              />
                              <p className="text-[10px] text-muted-foreground">
                                Premium models include image generation, web
                                search, and reasoning.
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center py-4">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Contact Us
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Legal and policy information.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href="https://kontinueai.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-border/60 bg-background/70 p-4 transition-colors hover:bg-background"
                  >
                    <p className="text-sm font-medium">Privacy Policy</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      How your data is handled.
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
                      Open <ExternalLink className="h-3 w-3" />
                    </span>
                  </Link>
                  <Link
                    href="https://kontinueai.com/legal/terms-of-service"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-border/60 bg-background/70 p-4 transition-colors hover:bg-background"
                  >
                    <p className="text-sm font-medium">Terms of Service</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Usage terms and responsibilities.
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
                      Open <ExternalLink className="h-3 w-3" />
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
