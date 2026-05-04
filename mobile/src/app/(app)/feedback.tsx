import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { FeedbackComposer } from "@/components/feedback/feedback-composer";
import { FeedbackPostCard } from "@/components/feedback/feedback-post-card";
import { FeedbackPostModal } from "@/components/feedback/feedback-post-modal";
import { Chip } from "@/components/ui/chip";
import { ScreenBackground } from "@/components/ui/screen";
import { SectionTitle } from "@/components/ui/section-title";
import { MainHeader } from "@/components/nav/MainHeader";
import type { FeedbackPost } from "@/features/feedback/types";
import { useFeedbackBoard } from "@/features/feedback/use-feedback-board";

export default function FeedbackScreen() {
  const {
    title,
    setTitle,
    details,
    setDetails,
    type,
    setType,
    topPosts,
    newPosts,
    publish,
    voteFeedbackPost,
    addFeedbackComment,
  } = useFeedbackBoard();

  const [tab, setTab] = useState<"top" | "new">("top");
  const [selectedPost, setSelectedPost] = useState<FeedbackPost | null>(null);

  const activePosts = tab === "top" ? topPosts : newPosts;

  return (
    <ScreenBackground>
      <MainHeader />
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-28 pt-5"
        keyboardShouldPersistTaps="handled"
      >
        <SectionTitle
          eyebrow="Feedback"
          title="Help shape Kontinue AI"
          description="Post ideas, report bugs, vote on priorities, and discuss feature direction."
        />

        <FeedbackComposer
          title={title}
          details={details}
          type={type}
          onTitleChange={setTitle}
          onDetailsChange={setDetails}
          onTypeChange={setType}
          onSubmit={() => {
            if (!publish()) {
              Alert.alert(
                "Missing details",
                "Add a title and details before publishing.",
              );
            }
          }}
        />

        <View className="flex-row gap-2">
          <Chip
            label="Top"
            selected={tab === "top"}
            onPress={() => setTab("top")}
          />
          <Chip
            label="New"
            selected={tab === "new"}
            onPress={() => setTab("new")}
          />
        </View>

        {activePosts.length === 0 ? (
          <Text className="text-sm text-muted-foreground">
            No posts yet. Be the first to post feedback.
          </Text>
        ) : (
          <View className="gap-3">
            {activePosts.map((post) => (
              <FeedbackPostCard
                key={`${tab}-${post.id}`}
                post={post}
                onVote={voteFeedbackPost}
                onOpenDetail={() => setSelectedPost(post)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <FeedbackPostModal
        post={selectedPost}
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onVote={voteFeedbackPost}
        onComment={addFeedbackComment}
      />
    </ScreenBackground>
  );
}
