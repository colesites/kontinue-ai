"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@convex/_generated/api";
import { SidebarAccountSection } from "./sidebar/SidebarAccountSection";
import { SidebarChatsSection } from "./sidebar/SidebarChatsSection";
import { SidebarHeaderSection } from "./sidebar/SidebarHeaderSection";
import { Sidebar as SidebarPrimitive, SidebarContent, useSidebar } from "./ui/sidebar";
import { usePlanTier } from "../lib/use-plan-tier";

export function Sidebar() {
  const pathname = usePathname();
  const sidebar = useSidebar();
  const { user } = useUser();
  const planTier = usePlanTier();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isSearching = searchQuery.trim().length > 0;
  const isDebouncing = searchQuery !== debouncedQuery;

  const allChats = useQuery(api.chats.getUserChats, isSearching ? "skip" : {});
  const searchedChats = useQuery(
    api.chats.searchChats,
    isSearching && debouncedQuery.trim() ? { query: debouncedQuery } : "skip",
  );

  const chats = isSearching ? searchedChats : allChats;
  const isLoading = isSearching
    ? isDebouncing || searchedChats === undefined
    : allChats === undefined;

  const displayName =
    user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "";
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  const userInitial =
    user?.firstName?.charAt(0) ?? displayName.charAt(0) ?? "U";

  const handleNavigate = () => {
    if (sidebar.isMobile) {
      sidebar.setOpenMobile(false);
    }
  };

  return (
    <SidebarPrimitive
      collapsible="offcanvas"
      className="border-r border-sidebar-border bg-sidebar/95 text-sidebar-foreground shadow-2xl"
    >
      <SidebarHeaderSection
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onClearSearch={() => setSearchQuery("")}
        onNavigate={handleNavigate}
      />

      <SidebarContent className="px-2 py-4">
        <SidebarChatsSection
          chats={chats}
          isLoading={isLoading}
          pathname={pathname}
          debouncedQuery={debouncedQuery}
          onNavigate={handleNavigate}
        />
      </SidebarContent>

      <SidebarAccountSection
        displayName={displayName}
        userEmail={userEmail}
        userInitial={userInitial}
        userImageUrl={user?.imageUrl}
        planTier={planTier}
        onNavigate={handleNavigate}
      />
    </SidebarPrimitive>
  );
}
