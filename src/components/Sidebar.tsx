"use client";

import { useQuery } from "convex/react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { UserButton, useAuth, useUser } from "@clerk/nextjs";
import {
  MessageSquarePlus,
  MessageCircle,
  Search as SearchIcon,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { api } from "../../convex/_generated/api";
import { Provider, getProviderColor } from "@/utils/url-safety";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar() {
  const pathname = usePathname();
  const sidebar = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Simple debounce logic
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isSearching = searchQuery.trim().length > 0;
  const isDebouncing = searchQuery !== debouncedQuery;

  const allChats = useQuery(api.chats.getUserChats, isSearching ? "skip" : {});

  const searchedChats = useQuery(
    api.chats.searchChats,
    isSearching && debouncedQuery.trim() ? { query: debouncedQuery } : "skip"
  );

  const chats = isSearching ? searchedChats : allChats;
  const isLoading = isSearching
    ? isDebouncing || searchedChats === undefined
    : allChats === undefined;

  const { user } = useUser();
  const { isLoaded: isAuthLoaded, has } = useAuth();

  const displayName =
    user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "";

  const hasChats = (chats?.length ?? 0) > 0;

  const handleNavigate = () => {
    if (sidebar.isMobile) {
      sidebar.setOpenMobile(false);
    }
  };

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

  const currentUser = useQuery(api.users.getCurrentUser, {});
  const isPro =
    isProFromClerkPlans || isProFromClerkLegacy || currentUser?.plan === "pro";

  return (
    <SidebarPrimitive
      collapsible="offcanvas"
      className="border-r border-sidebar-border bg-sidebar/95 text-sidebar-foreground shadow-2xl"
    >
      <SidebarHeader className="border-b border-sidebar-border/60 p-4 pb-5">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger
              aria-label="Close sidebar"
              className="h-8 w-8 border border-sidebar-border/60 text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
            />
            <div>
              <p className="text-base font-semibold tracking-tight">
                Continue AI
              </p>
            </div>
          </div>
          <Link
            href="/"
            onClick={handleNavigate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <MessageSquarePlus size={18} />
            <span>New Chat</span>
          </Link>
          <div className="relative">
            <SearchIcon
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sidebar-foreground/60"
            />
            <SidebarInput
              id="sidebar-thread-search"
              placeholder="Search your threads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-sidebar-accent/30 pl-9 pr-9 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/50 transition-all focus:bg-sidebar-accent/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-foreground/40 hover:text-sidebar-foreground/80 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sidebar-foreground/60 px-2">
            {debouncedQuery.trim() ? "Search Results" : "Recent Chats"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                chats?.map((chat) => {
                  const isActive = pathname === `/chat/${chat._id}`;
                  return (
                    <SidebarMenuItem key={chat._id}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={chat.title}
                        className={cn(
                          "border border-transparent text-sm h-10 px-3",
                          "data-[active=true]:border-sidebar-border data-[active=true]:bg-sidebar-accent/40 data-[active=true]:text-sidebar-accent-foreground"
                        )}
                      >
                        <Link
                          href={`/chat/${chat._id}`}
                          onClick={handleNavigate}
                          className="flex items-center gap-3"
                        >
                          <MessageCircle
                            size={16}
                            style={{
                              color: isActive
                                ? undefined
                                : getProviderColor(
                                    chat.source.provider as Provider
                                  ),
                            }}
                          />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate">{chat.title}</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" align="start">
                              <p className="max-w-[280px] text-xs">
                                {chat.title}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>

            {!hasChats && !isLoading && (
              <p className="mt-4 rounded-xl border border-dashed border-sidebar-border/60 px-3 py-4 text-center text-xs text-sidebar-foreground/60">
                {debouncedQuery.trim()
                  ? `No results found for "${debouncedQuery}"`
                  : "No chats yet. Import a conversation to get started."}
              </p>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60 p-4">
        <div className="space-y-4">
          {!isPro && (
            <Link
              href="/pricing"
              onClick={handleNavigate}
              className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 p-3 text-xs font-semibold text-primary hover:bg-primary/20 transition-all group"
            >
              <Sparkles
                size={14}
                className="group-hover:rotate-12 transition-transform"
              />
              <span>Upgrade to Pro</span>
            </Link>
          )}
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9",
                },
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium leading-tight text-sidebar-foreground">
                  {displayName || "Logged in"}
                </p>
                {isPro && (
                  <span className="shrink-0 rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary border border-primary/30">
                    PRO
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
