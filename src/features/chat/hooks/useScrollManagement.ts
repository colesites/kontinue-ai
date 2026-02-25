import { useRef, useState, useEffect, useCallback } from "react";

import { DisplayMessage } from "./useChatMessageTransformer";

export function useScrollManagement(deps: DisplayMessage[]) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottomButton, setShowScrollToBottomButton] =
    useState(false);
  const [showScrollToTopButton, setShowScrollToTopButton] = useState(false);

  const getScrollMetrics = useCallback(() => {
    const container = document.getElementById("chat-scroll-container");
    if (container) {
      return {
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
      };
    }

    return {
      scrollTop: window.scrollY,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: window.innerHeight,
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const scrollToTop = useCallback(() => {
    const container = document.getElementById("chat-scroll-container");
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [deps, scrollToBottom]);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = getScrollMetrics();
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setShowScrollToBottomButton(distanceFromBottom > 200);
      setShowScrollToTopButton(scrollTop > 300);
    };

    const target = document.getElementById("chat-scroll-container") || window;
    target.addEventListener("scroll", handleScroll, { passive: true });
    const timer = setTimeout(handleScroll, 100);

    return () => {
      target.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [deps.length, getScrollMetrics]);

  return {
    messagesEndRef,
    showScrollToBottomButton,
    showScrollToTopButton,
    scrollToBottom,
    scrollToTop,
  };
}
