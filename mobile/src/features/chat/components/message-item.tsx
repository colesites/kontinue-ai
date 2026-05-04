import React from "react";
import { Text, View } from "react-native";
import { useThemePalette } from "@/providers/ThemeProvider";
import type { ChatMessage } from "../types";
import { MessageContent } from "./message-content";

interface MessageItemProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export const MessageItem = React.memo(
  ({ message, isStreaming }: MessageItemProps) => {
    const { palette } = useThemePalette();
    const isUser = message.role === "user";

    return (
      <View
        className={`flex-row px-4 py-2 ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        <View
          className={`max-w-[88%] rounded-[24px] border px-4 py-3 ${
            isUser
              ? "border-primary/15 bg-primary"
              : "border-border/50 bg-card/85"
          }`}
        >
          {!isUser && (
            <Text className="mb-1 text-[11px] font-bold uppercase tracking-[1.5px] text-primary">
              {message.modelId ? message.modelId.split("/")[1] : "Assistant"}
            </Text>
          )}

          <MessageContent
            content={message.content}
            isStreaming={isStreaming && !isUser}
          />

          <View className="mt-2 flex-row items-center justify-end opacity-60">
            <Text
              className={`text-[10px] ${
                isUser ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>
      </View>
    );
  },
);

MessageItem.displayName = "MessageItem";
