import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { PROVIDER_CONFIG } from "@/utils/url-safety";
import { useUser } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";

import { useThemePalette } from "@/providers/ThemeProvider";

type HomeIntroProps = {
  onOpenInfo: () => void;
  onOpenImport: () => void;
};

export function HomeIntro({ onOpenInfo, onOpenImport }: HomeIntroProps) {
  const { user } = useUser();
  const userName = user?.firstName || "there";
  const { palette, scheme } = useThemePalette();
  const iconColor = `rgb(${palette.mutedForeground})`;
  const logoTintColor = scheme === "light" ? "#000000" : "#ffffff";

  return (
    <View className="gap-8 pt-2">
      <View className="gap-4">
        <Image
          key={scheme}
          source={require("../../../assets/images/kontinueai.png")}
          className="h-10 w-32"
          resizeMode="contain"
          style={{ tintColor: logoTintColor }}
        />
        <Text className="max-w-[320px] text-4xl font-bold text-foreground leading-[46px]">
          How can I help you, {userName}?
        </Text>
        <Text className="max-w-[340px] text-base leading-6 text-muted-foreground">
          Ask anything to start a new chat, or import a shared link from another
          AI app.
        </Text>
      </View>

      <View className="flex-row flex-wrap items-center gap-3">
        <Pressable
          onPress={onOpenInfo}
          className="rounded-full border border-border/60 bg-card/60 px-4 py-2.5"
        >
          <Text className="text-sm font-medium text-foreground">
            How does this work?
          </Text>
        </Pressable>
        <Pressable
          onPress={onOpenImport}
          className="flex-row items-center gap-2 rounded-full border border-primary/25 bg-primary px-4 py-2.5"
        >
          <Feather
            name="arrow-up-right"
            size={16}
            color={`rgb(${palette.primaryForeground})`}
          />
          <Text className="text-sm font-semibold text-primary-foreground">
            Import shared link
          </Text>
        </Pressable>
      </View>

      <Card className="w-full rounded-[28px] border-border/50 bg-card/80 p-6">
        <Text className="mb-6 text-lg font-bold text-foreground">
          How it works
        </Text>

        <View className="mb-8 gap-6">
          <View className="flex-row gap-4">
            <View className="w-10 h-10 bg-background rounded-xl items-center justify-center border border-border/50">
              <Feather name="copy" size={18} color={iconColor} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground mb-1">
                Start from chat input
              </Text>
              <Text className="text-sm text-muted-foreground leading-5">
                Type your prompt below. A new conversation opens instantly.
              </Text>
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="w-10 h-10 bg-background rounded-xl items-center justify-center border border-border/50">
              <Feather name="link" size={18} color={iconColor} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground mb-1">
                Import when needed
              </Text>
              <Text className="text-sm text-muted-foreground leading-5">
                Use the import button to paste a shared link in a modal.
              </Text>
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="w-10 h-10 bg-background rounded-xl items-center justify-center border border-border/50">
              <Feather name="zap" size={18} color={iconColor} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground mb-1">
                Continue naturally
              </Text>
              <Text className="text-sm text-muted-foreground leading-5">
                Pick your model and keep going with full context.
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {Object.entries(PROVIDER_CONFIG)
            .filter(([key]) => key !== "unknown")
            .map(([key, provider]) => (
              <Chip key={key} label={provider.name} dotColor={provider.color} />
            ))}
        </View>
      </Card>
    </View>
  );
}
