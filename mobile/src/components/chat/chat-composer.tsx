import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { ModelSelectorSheet } from "@/components/chat/model-selector-sheet";
import { Card } from "@/components/ui/card";
import { getModelById } from "@/lib/models";
import { useThemePalette } from "@/providers/ThemeProvider";

type ChatComposerProps = {
  value: string;
  onChangeValue: (value: string) => void;
  onSend: () => void;
  isSending?: boolean;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  placeholder?: string;
};

export function ChatComposer({
  value,
  onChangeValue,
  onSend,
  isSending,
  selectedModel,
  onModelChange,
  placeholder,
}: ChatComposerProps) {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const selectedModelName = getModelById(selectedModel)?.name ?? selectedModel;
  const { palette } = useThemePalette();
  const iconColorPrimary = `rgb(${palette.foreground})`;
  const iconColorMuted = `rgb(${palette.mutedForeground})`;

  return (
    <Card className="rounded-[30px] border-border/50 bg-card/96 p-4 shadow-2xl">
      <TextInput
        multiline
        value={value}
        onChangeText={onChangeValue}
        placeholder={placeholder ?? "Ask anything..."}
        placeholderTextColor="#9ca3af"
        className="mb-3 min-h-[56px] max-h-32 px-2 py-2 text-[17px] text-foreground"
        textAlignVertical="top"
      />

      <View className="flex-row items-center justify-between">
        <View className="mr-3 flex-1 flex-row items-center gap-2">
          <Pressable
            className="max-w-[78%] flex-row items-center gap-2 rounded-full border border-border/40 bg-secondary/40 px-3 py-2"
            onPress={() => setSelectorOpen(true)}
          >
            <Feather name="zap" size={14} color={iconColorPrimary} />
            <Text
              className="text-sm font-bold text-foreground"
              numberOfLines={1}
            >
              {selectedModelName}
            </Text>
          </Pressable>

          <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-secondary/30">
            <Feather name="paperclip" size={20} color={iconColorMuted} />
          </Pressable>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-secondary/30">
            <Feather name="mic" size={20} color={iconColorMuted} />
          </Pressable>

          <Pressable
            onPress={onSend}
            disabled={!value.trim() || !!isSending}
            className={`h-11 w-11 items-center justify-center rounded-full ${
              value.trim()
                ? "border border-primary/20 bg-primary"
                : "bg-muted/30"
            }`}
          >
            <Feather
              name="navigation"
              size={18}
              color={
                value.trim()
                  ? `rgb(${palette.primaryForeground})`
                  : iconColorMuted
              }
              style={{ transform: [{ rotate: "1deg" }] }}
            />
          </Pressable>
        </View>
      </View>

      <ModelSelectorSheet
        open={selectorOpen}
        selectedModelId={selectedModel}
        onClose={() => setSelectorOpen(false)}
        onSelect={onModelChange}
      />
    </Card>
  );
}
