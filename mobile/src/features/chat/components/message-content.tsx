import React from "react";
import { StyleSheet, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { useThemePalette } from "@/providers/ThemeProvider";

interface MessageContentProps {
  content: string;
  isStreaming?: boolean;
}

export const MessageContent = React.memo(
  ({ content, isStreaming }: MessageContentProps) => {
    const { palette } = useThemePalette();

    const styles = StyleSheet.create({
      body: {
        color: `rgb(${palette.foreground})`,
        fontSize: 16,
        lineHeight: 24,
      },
      code_inline: {
        backgroundColor: `rgba(${palette.secondary}, 0.7)`,
        color: `rgb(${palette.primary})`,
        borderRadius: 4,
        paddingHorizontal: 4,
        fontFamily: "System",
      },
      code_block: {
        backgroundColor: `rgba(${palette.secondary}, 0.55)`,
        color: `rgb(${palette.foreground})`,
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: `rgba(${palette.border}, 0.8)`,
        fontFamily: "System",
      },
      fence: {
        backgroundColor: `rgba(${palette.secondary}, 0.55)`,
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: `rgba(${palette.border}, 0.8)`,
      },
      link: {
        color: `rgb(${palette.primary})`,
        textDecorationLine: "underline",
      },
      paragraph: {
        marginTop: 0,
        marginBottom: 8,
      },
      heading1: {
        fontSize: 24,
        fontWeight: "bold",
        color: `rgb(${palette.foreground})`,
        marginVertical: 12,
      },
      heading2: {
        fontSize: 20,
        fontWeight: "bold",
        color: `rgb(${palette.foreground})`,
        marginVertical: 10,
      },
      blockquote: {
        backgroundColor: `rgba(${palette.secondary}, 0.5)`,
        borderLeftWidth: 4,
        borderLeftColor: `rgb(${palette.primary})`,
        paddingLeft: 12,
        paddingVertical: 8,
        marginVertical: 8,
      },
    });

    return (
      <View className="flex-1">
        <Markdown style={styles}>{content}</Markdown>
        {isStreaming && (
          <View className="flex-row items-center mt-1">
            <View className="w-2 h-4 bg-primary animate-pulse" />
          </View>
        )}
      </View>
    );
  },
);

MessageContent.displayName = "MessageContent";
