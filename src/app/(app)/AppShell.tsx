"use client";

import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { usePathname } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { api } from "@convex/_generated/api";
import { Sidebar as AppSidebar } from "@/components/Sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/utils/cn";
import { ModeToggle } from "@/components/ModeToggle";
import { ShareButton } from "@/components/ShareButton";
import { ChatProvider, useChatContext } from "@/contexts/ChatContext";
import { persistedPlanForTier } from "@/lib/plan-tier";
import { usePlanTier } from "@/lib/use-plan-tier";

export function AppShell({
  children,
  defaultOpen = true,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const { user, isLoaded } = useUser();
  const { isLoaded: isAuthLoaded } = useAuth();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const planTier = usePlanTier();

  useEffect(() => {
    if (!isLoaded || !isAuthLoaded || !user) {
      return;
    }

    void getOrCreateUser({
      clerkUserId: user.id,
      email: user.primaryEmailAddress?.emailAddress ?? "",
      name: user.fullName ?? undefined,
      imageUrl: user.imageUrl ?? undefined,
      subscriptionStatus: planTier === "free" ? "inactive" : "active",
      plan: persistedPlanForTier(planTier),
    });
  }, [getOrCreateUser, isAuthLoaded, isLoaded, planTier, user]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ChatProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <ShellLayout>{children}</ShellLayout>
      </SidebarProvider>
    </ChatProvider>
  );
}

function ShellLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isMobile, open, openMobile, setOpenMobile, setOpen } = useSidebar();
  const { chatId, chatTitle } = useChatContext();
  const isHome = pathname === "/";

  const toolbarButtonClasses =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground/85 transition-colors hover:text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

  const focusSidebarSearch = () => {
    const input = document.getElementById(
      "sidebar-thread-search",
    ) as HTMLInputElement | null;
    if (!input) return;
    input.focus();
    const valueLength = input.value.length;
    input.setSelectionRange(valueLength, valueLength);
  };

  const handleSearchClick = () => {
    if (isMobile && !openMobile) {
      setOpenMobile(true);
      window.setTimeout(focusSidebarSearch, 220);
    } else {
      setOpen(true);
      window.requestAnimationFrame(focusSidebarSearch);
    }
  };

  const handleNewChatClick = () => {
    if (isMobile && openMobile) {
      setOpenMobile(false);
    }
  };

  const hideTriggerGroup = open || openMobile;

  return (
    <>
      <AppSidebar />
      <SidebarInset className="bg-background h-dvh flex flex-col overflow-hidden">
        {/* Floating top controls */}
        <div className="pointer-events-none fixed inset-x-0 top-3 z-40 flex items-start justify-between px-3">
          <div
            className={cn(
              "pointer-events-auto flex items-center gap-3 rounded-2xl border border-border/50 bg-secondary/70 p-1 text-foreground shadow-sm backdrop-blur-sm",
              hideTriggerGroup && "pointer-events-none opacity-0 scale-95",
            )}
            aria-hidden={hideTriggerGroup}
          >
            <SidebarTrigger className={toolbarButtonClasses} />
            <button
              type="button"
              onClick={handleSearchClick}
              className={toolbarButtonClasses}
              aria-label="Search chats"
            >
              <Search className="size-4" />
            </button>
            <Link
              href="/"
              className={toolbarButtonClasses}
              aria-label="Start new chat"
              onClick={handleNewChatClick}
            >
              <Plus className="size-4" />
            </Link>
          </div>
          <div className="pointer-events-auto">
            <div className="flex items-center gap-2">
              {chatId && chatTitle && (
                <ShareButton chatId={chatId} chatTitle={chatTitle} />
              )}
              <ModeToggle />
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col min-h-0">
          <div
            id="chat-scroll-container"
            className={cn("flex-1 overflow-y-auto", isHome ? "pt-0" : "pt-9")}
          >
            {children}
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
