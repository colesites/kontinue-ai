import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { LuPin } from "react-icons/lu";
import { SidebarChatActionsMenu } from "@/components/sidebar/SidebarChatActionsMenu";
import { SidebarChatRenameRow } from "@/components/sidebar/SidebarChatRenameRow";
import { SidebarChat } from "@/components/sidebar/sidebar-chat-types";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";
import { type Provider, PROVIDER_CONFIG } from "@/utils/url-safety";

type SidebarChatRowProps = {
  chat: SidebarChat;
  pathname: string;
  onNavigate: () => void;
  isRenaming: boolean;
  isBusy: boolean;
  renameValue: string;
  onRenameChange: (value: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onStartRename: () => void;
  onTogglePin: () => void;
  onShare: () => void;
  onDelete: () => void;
};

export function SidebarChatRow({
  chat,
  pathname,
  onNavigate,
  isRenaming,
  isBusy,
  renameValue,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onStartRename,
  onTogglePin,
  onShare,
  onDelete,
}: SidebarChatRowProps) {
  const isActive = pathname === `/chat/${chat._id}`;
  const provider = chat.source?.provider as Provider | undefined;
  const providerColor = provider ? PROVIDER_CONFIG[provider]?.color : undefined;

  return (
    <SidebarMenuItem>
      {isRenaming ? (
        <SidebarChatRenameRow
          providerColor={providerColor}
          isActive={isActive}
          isBusy={isBusy}
          renameValue={renameValue}
          onRenameChange={onRenameChange}
          onRenameSubmit={onRenameSubmit}
          onRenameCancel={onRenameCancel}
        />
      ) : (
        <>
          <SidebarMenuButton
            asChild
            isActive={isActive}
            tooltip={chat.title}
            className={cn(
              "h-10 border border-transparent px-3 pr-10 text-sm",
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
              {chat.pinnedAt ? (
                <LuPin className="h-3.5 w-3.5 shrink-0 text-primary/80" />
              ) : null}
            </Link>
          </SidebarMenuButton>
          <SidebarChatActionsMenu
            chat={chat}
            isBusy={isBusy}
            onTogglePin={onTogglePin}
            onStartRename={onStartRename}
            onShare={onShare}
            onDelete={onDelete}
          />
        </>
      )}
    </SidebarMenuItem>
  );
}
