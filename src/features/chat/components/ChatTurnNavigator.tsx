"use client";

import { useState } from "react";
import { DesktopChatTurnNavigator } from "@/features/chat/components/DesktopChatTurnNavigator";
import { MobileChatTurnNavigator } from "@/features/chat/components/MobileChatTurnNavigator";
import { useChatTurnNavigation } from "@/features/chat/hooks/useChatTurnNavigation";
import { type ChatTurn } from "@/features/chat/lib/chat-turns";

type ChatTurnNavigatorProps = {
  turns: ChatTurn[];
  showScrollToTopButton: boolean;
  showScrollToBottomButton: boolean;
  onScrollToTop: () => void;
  onScrollToBottom: () => void;
};

export function ChatTurnNavigator({
  turns,
  showScrollToTopButton,
  showScrollToBottomButton,
  onScrollToTop,
  onScrollToBottom,
}: ChatTurnNavigatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { activeTurnId, jumpToTurn } = useChatTurnNavigation(turns);
  const showDesktopNavigator = turns.length >= 2;
  const showMobileControl =
    showScrollToTopButton || showScrollToBottomButton || turns.length >= 2;

  if (!showDesktopNavigator && !showMobileControl) return null;

  return (
    <>
      {showDesktopNavigator ? (
        <DesktopChatTurnNavigator
          turns={turns}
          activeTurnId={activeTurnId}
          isExpanded={isExpanded}
          onExpandChange={setIsExpanded}
          onJumpToTurn={jumpToTurn}
        />
      ) : null}
      {showMobileControl ? (
        <MobileChatTurnNavigator
          turns={turns}
          activeTurnId={activeTurnId}
          onJumpToTurn={jumpToTurn}
          showScrollToTopButton={showScrollToTopButton}
          showScrollToBottomButton={showScrollToBottomButton}
          onScrollToTop={onScrollToTop}
          onScrollToBottom={onScrollToBottom}
        />
      ) : null}
    </>
  );
}
