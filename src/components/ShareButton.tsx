"use client";

import { useState } from "react";
import { LuShare } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { ShareModal } from "@/components/ShareModal";

interface ShareButtonProps {
  chatId: string;
  chatTitle: string;
}

export function ShareButton({ chatId, chatTitle }: ShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        size="icon"
        className="bg-secondary/80 hover:bg-secondary/90 backdrop-blur-sm"
        onClick={() => setIsModalOpen(true)}
        aria-label="Share chat"
      >
        <LuShare className="h-[1.2rem] w-[1.2rem]" />
      </Button>
      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        chatId={chatId}
        chatTitle={chatTitle}
      />
    </>
  );
}
