import { MainHeader } from "@/components/nav/MainHeader";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { ScreenBackground } from "@/components/ui/screen";
import { ChatList } from "@/features/chat/components/chat-list";
import { PromptInput } from "@/features/chat/components/prompt-input";
import { useChatScreen } from "@/features/chat/use-chat-screen";

export default function ChatScreen() {
  const router = useRouter();
  const { chat, isSending, onSend } = useChatScreen();

  if (!chat) {
    return (
      <ScreenBackground>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-base text-slate-200">
            Chat not found.
          </Text>
          <Pressable
            className="mt-4 rounded-xl border border-slate-700 px-4 py-2"
            onPress={() => router.replace("/")}
          >
            <Text className="text-sm text-slate-100">Back home</Text>
          </Pressable>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <MainHeader />
      <View className="border-b border-border/40 px-5 pb-4 pt-5">
        <Text className="text-xs font-semibold uppercase tracking-[2px] text-muted-foreground">
          Chat
        </Text>
        <Text className="mt-1 text-2xl font-bold text-foreground" numberOfLines={1}>
          {chat.title}
        </Text>
      </View>

      <View className="flex-1">
        <ChatList messages={chat.messages} isStreaming={isSending} />
      </View>

      <PromptInput
        onSend={() => void onSend()}
        disabled={isSending}
        placeholder="Continue the conversation..."
      />
    </ScreenBackground>
  );
}
