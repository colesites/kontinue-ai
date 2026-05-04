import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemePalette } from "@/providers/ThemeProvider";

interface PromptInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const PromptInput = ({
  onSend,
  disabled,
  placeholder = "Ask me anything...",
}: PromptInputProps) => {
  const [text, setText] = useState("");
  const insets = useSafeAreaInsets();
  const { palette } = useThemePalette();
  const mutedColor = `rgb(${palette.mutedForeground})`;

  const handleSend = () => {
    if (text.trim() && !disabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSend(text.trim());
      setText("");
    }
  };

  return (
    <View
      className="border-t border-border/40 bg-background/95 px-4 pt-3"
      style={{ paddingBottom: Platform.OS === "ios" ? Math.max(insets.bottom, 12) : 14 }}
    >
      <View className="flex-row items-end gap-2 rounded-[28px] border border-border/50 bg-card/96 px-3 py-3">
        {!text.length && (
          <View className="flex-row gap-2 pb-1">
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full bg-secondary/35"
              onPress={() =>
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              }
            >
              <Feather name="mic" size={18} color={mutedColor} />
            </Pressable>
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full bg-secondary/35"
              onPress={() =>
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              }
            >
              <Feather name="plus" size={18} color={mutedColor} />
            </Pressable>
          </View>
        )}

        <TextInput
          className="max-h-32 flex-1 px-1 text-base text-foreground"
          multiline
          placeholder={placeholder}
          placeholderTextColor={mutedColor}
          value={text}
          onChangeText={setText}
          editable={!disabled}
          style={{ paddingVertical: 8 }}
        />

        <Pressable
          onPress={handleSend}
          disabled={!text.trim() || disabled}
          className={`mb-0.5 h-11 w-11 items-center justify-center rounded-full ${
            text.trim() ? "bg-primary" : "bg-secondary/35"
          }`}
        >
          <Feather
            name="arrow-up"
            size={18}
            color={
              text.trim()
                ? `rgb(${palette.primaryForeground})`
                : mutedColor
            }
          />
        </Pressable>
      </View>
    </View>
  );
};
