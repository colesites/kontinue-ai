import { useThemePalette } from "@/providers/ThemeProvider";
import { Feather } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation, usePathname, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeSelectorSheet } from "./theme-selector-sheet";

type MainHeaderProps = {
  canvasMenu?: {
    tab: "community" | "mine";
    onSelectTab: (tab: "community" | "mine") => void;
  };
};

export function MainHeader({ canvasMenu }: MainHeaderProps) {
  const navigation = useNavigation();
  const router = useRouter();
  const { mode, palette } = useThemePalette();
  const [themeSheetOpen, setThemeSheetOpen] = useState(false);
  const [canvasMenuOpen, setCanvasMenuOpen] = useState(false);
  const [canvasTriggerWidth, setCanvasTriggerWidth] = useState(0);
  const pathname = usePathname();
  const iconColor = `rgb(${palette.foreground})`;

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const modeIcon =
    mode === "dark" ? "moon" : mode === "light" ? "sun" : "monitor";

  const insets = useSafeAreaInsets();
  const isCanvasRoute = pathname?.includes("/canvas");
  const showCanvasMenu = Boolean(isCanvasRoute && canvasMenu);
  const currentCanvasLabel =
    canvasMenu?.tab === "mine" ? "My Creations" : "Community";

  return (
    <View className="z-50" pointerEvents="box-none">
      {showCanvasMenu && canvasMenuOpen ? (
        <Pressable
          className="absolute inset-0"
          onPress={() => setCanvasMenuOpen(false)}
        />
      ) : null}

      <View
        className="relative flex-row items-center justify-between border-b border-border/40 bg-background/95 px-5 pb-3"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={openDrawer}
            className="h-11 w-11 items-center justify-center rounded-2xl border border-border/50 bg-card/80 active:bg-muted"
          >
            <Feather name="sidebar" size={20} color={iconColor} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/")}
            className="h-11 w-11 items-center justify-center rounded-2xl border border-border/50 bg-card/80 active:bg-muted"
          >
            <Feather name="search" size={20} color={iconColor} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/")}
            className="h-11 w-11 items-center justify-center rounded-2xl border border-border/50 bg-card/80 active:bg-muted"
          >
            <Feather name="plus" size={20} color={iconColor} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => setThemeSheetOpen(true)}
          className="h-11 w-11 items-center justify-center rounded-2xl border border-border/50 bg-card/80"
        >
          <Feather name={modeIcon} size={22} color={iconColor} />
        </Pressable>

        {showCanvasMenu ? (
          <View
            className="absolute left-0 right-0 items-center"
            style={{ top: insets.top + 8 }}
            pointerEvents="box-none"
          >
            <View className="relative">
              <View className="rounded-2xl border border-border/50 bg-card/92 p-0.5 shadow-sm">
                <Pressable
                  onPress={() => setCanvasMenuOpen((prev) => !prev)}
                  className="flex-row h-12 items-center gap-2 rounded-xl px-4"
                  onLayout={(event) => {
                    const width = Math.round(event.nativeEvent.layout.width);
                    if (width && width !== canvasTriggerWidth) {
                      setCanvasTriggerWidth(width);
                    }
                  }}
                >
                  <Text className="text-sm font-semibold text-foreground">
                    {currentCanvasLabel}
                  </Text>
                  <Feather name="chevron-down" size={16} color={iconColor} />
                </Pressable>
              </View>

              {canvasMenuOpen ? (
                <View
                  className="absolute z-[200] rounded-2xl border border-border bg-card p-2 shadow-xl"
                  style={{
                    top: 58,
                    left: -6,
                    width: Math.max((canvasTriggerWidth || 160) + 20, 180),
                  }}
                >
                  <Pressable
                    onPress={() => {
                      canvasMenu?.onSelectTab("community");
                      setCanvasMenuOpen(false);
                    }}
                    className={`flex-row items-center justify-between rounded-xl px-3 py-2.5 ${
                      canvasMenu?.tab === "community"
                        ? "bg-secondary"
                        : "bg-transparent"
                    }`}
                  >
                    <Text className="text-sm font-semibold text-foreground">
                      Community
                    </Text>
                    {canvasMenu?.tab === "community" ? (
                      <Feather name="check" size={16} color={iconColor} />
                    ) : null}
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      canvasMenu?.onSelectTab("mine");
                      setCanvasMenuOpen(false);
                    }}
                    className={`flex-row items-center justify-between rounded-xl px-3 py-2.5 ${
                      canvasMenu?.tab === "mine"
                        ? "bg-secondary"
                        : "bg-transparent"
                    }`}
                  >
                    <Text className="text-sm font-semibold text-foreground">
                      My Creations
                    </Text>
                    {canvasMenu?.tab === "mine" ? (
                      <Feather name="check" size={16} color={iconColor} />
                    ) : null}
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        <ThemeSelectorSheet
          open={themeSheetOpen}
          onClose={() => setThemeSheetOpen(false)}
        />
      </View>
    </View>
  );
}
