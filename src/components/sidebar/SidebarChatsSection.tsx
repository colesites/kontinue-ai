import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import { Provider, PROVIDER_CONFIG } from "@/utils/url-safety";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SidebarChat = {
  _id: string;
  title: string;
  source?: {
    provider?: string | null;
  } | null;
};

type SidebarChatsSectionProps = {
  chats: SidebarChat[] | undefined;
  isLoading: boolean;
  pathname: string;
  debouncedQuery: string;
  onNavigate: () => void;
};

export function SidebarChatsSection({
  chats,
  isLoading,
  pathname,
  debouncedQuery,
  onNavigate,
}: SidebarChatsSectionProps) {
  const hasChats = (chats?.length ?? 0) > 0;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-sidebar-foreground/60">
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
              const provider = chat.source?.provider as Provider | undefined;
              const providerColor = provider
                ? PROVIDER_CONFIG[provider]?.color
                : undefined;

              return (
                <SidebarMenuItem key={chat._id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={chat.title}
                    className={cn(
                      "h-10 border border-transparent px-3 text-sm",
                      "data-[active=true]:border-sidebar-border data-[active=true]:bg-sidebar-accent/40 data-[active=true]:text-sidebar-accent-foreground",
                    )}
                  >
                    <Link
                      href={`/chat/${chat._id}`}
                      onClick={onNavigate}
                      className="flex items-center gap-3"
                    >
                      <MessageCircle
                        size={16}
                        style={{
                          color: isActive ? undefined : providerColor,
                        }}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate">{chat.title}</span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="start">
                          <p className="max-w-[280px] text-xs">{chat.title}</p>
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
  );
}
