"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { MobileChatTurnNavigatorDialog } from "@/features/chat/components/MobileChatTurnNavigatorDialog";
import { useDoubleTapActivation } from "@/features/chat/hooks/useDoubleTapActivation";
import { type ChatTurn } from "@/features/chat/lib/chat-turns";
import { cn } from "@/utils/cn";

type MobileChatTurnNavigatorProps = {
  turns: ChatTurn[];
  activeTurnId: string | null;
  onJumpToTurn: (turnId: string) => void;
  showScrollToTopButton: boolean;
  showScrollToBottomButton: boolean;
  onScrollToTop: () => void;
  onScrollToBottom: () => void;
};

export function MobileChatTurnNavigator({
  turns,
  activeTurnId,
  onJumpToTurn,
  showScrollToTopButton,
  showScrollToBottomButton,
  onScrollToTop,
  onScrollToBottom,
}: MobileChatTurnNavigatorProps) {
  const [open, setOpen] = useState(false);
  const { isArmed, registerTap } = useDoubleTapActivation();
  const quickAction = showScrollToBottomButton
    ? "bottom"
    : showScrollToTopButton
      ? "top"
      : null;
  const quickIcon =
    quickAction === "bottom" ? (
      <ArrowDown className="h-3.5 w-3.5" />
    ) : quickAction === "top" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <span className="text-[9px]">{turns.length > 99 ? "99+" : turns.length}</span>
    );

  const handleTriggerTap = () => {
    registerTap({
      onSingleTap: () => {
        if (quickAction === "bottom") onScrollToBottom();
        if (quickAction === "top") onScrollToTop();
      },
      onDoubleTap: () => setOpen(true),
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleTriggerTap}
        className={cn(
          "fixed bottom-38 left-1/2 z-50 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-border/70 bg-background/85 text-foreground shadow-lg backdrop-blur-sm transition-all lg:hidden",
          isArmed && "scale-105 border-primary/60 text-primary",
        )}
        aria-label={`Single tap quick scroll, double tap open navigator (${turns.length} turns)`}
      >
        {quickIcon}
      </button>

      <MobileChatTurnNavigatorDialog
        open={open}
        onOpenChange={setOpen}
        turns={turns}
        activeTurnId={activeTurnId}
        onJumpToTurn={onJumpToTurn}
        onScrollToTop={onScrollToTop}
        onScrollToBottom={onScrollToBottom}
      />
    </>
  );
}
