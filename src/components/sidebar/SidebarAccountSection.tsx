"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ChevronUp, Sparkles } from "lucide-react";
import { IoSettingsSharp } from "react-icons/io5";
import { LuMessageSquarePlus } from "react-icons/lu";
import { SidebarFooter } from "@/components/ui/sidebar";
import { planLabel, type PlanTier } from "@/lib/plan-tier";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SidebarAccountSectionProps = {
  displayName: string;
  userEmail: string;
  userInitial: string;
  userImageUrl?: string;
  planTier: PlanTier;
  onNavigate: () => void;
};

export function SidebarAccountSection({
  displayName,
  userEmail,
  userInitial,
  userImageUrl,
  planTier,
  onNavigate,
}: SidebarAccountSectionProps) {
  const isPaid = planTier !== "free";
  const isTopTier = planTier === "pro";
  const feedbackHref = "/feedback";

  return (
    <SidebarFooter className="border-t border-sidebar-border/60 p-4">
      <div className="space-y-4">
        {!isTopTier && (
          <Link
            href="/pricing"
            onClick={onNavigate}
            className="group flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs font-semibold text-primary transition-all hover:bg-primary/20"
          >
            <Sparkles
              size={14}
              className="transition-transform group-hover:rotate-12"
            />
            <span>
              {planTier === "starter" ? "Upgrade to Pro" : "Upgrade to Starter"}
            </span>
          </Link>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/20 p-2.5 text-left transition-colors hover:bg-sidebar-accent/40 data-[state=open]:bg-sidebar-accent/50"
            >
              {userImageUrl ? (
                <span
                  className="h-9 w-9 shrink-0 rounded-full border border-sidebar-border/60 bg-sidebar-accent/50 bg-cover bg-center"
                  style={{ backgroundImage: `url(${userImageUrl})` }}
                />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sidebar-border/60 bg-primary/15 text-sm font-semibold text-primary">
                  {userInitial.toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium leading-tight text-sidebar-foreground">
                  {displayName || "Logged in"}
                </p>
                <p className="truncate text-[10px] leading-tight text-sidebar-foreground/60">
                  {userEmail || "Account"}
                </p>
              </div>
              <ChevronUp className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="top"
            className="w-(--radix-dropdown-menu-trigger-width) min-w-(--radix-dropdown-menu-trigger-width) border-sidebar-border bg-sidebar text-sidebar-foreground"
          >
            <div className="flex items-center gap-3 rounded-md px-2 py-2">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9",
                  },
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium leading-tight text-sidebar-foreground">
                  {displayName || "Logged in"}
                </p>
                <p className="truncate text-[10px] leading-tight text-sidebar-foreground/60">
                  {userEmail || "Account"}
                </p>
              </div>
              {isPaid && (
                <span className="shrink-0 rounded-md border border-primary/30 bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  {planLabel(planTier).toUpperCase()}
                </span>
              )}
            </div>
            <DropdownMenuSeparator className="bg-sidebar-border/70" />
            <DropdownMenuItem
              asChild
              className="cursor-pointer rounded-md text-sm text-sidebar-foreground hover:text-sidebar-foreground"
            >
              <Link
                href="/settings"
                onClick={onNavigate}
                className="flex items-center gap-2"
              >
                <IoSettingsSharp className="h-4 w-4 text-primary" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="cursor-pointer rounded-md text-sm text-sidebar-foreground hover:text-sidebar-foreground"
            >
              <Link
                href={feedbackHref}
                onClick={onNavigate}
                className="flex items-center gap-2"
              >
                <LuMessageSquarePlus className="h-4 w-4 text-primary" />
                <span>Feedback</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </SidebarFooter>
  );
}
