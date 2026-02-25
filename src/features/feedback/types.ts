import type { Id } from "@convex/_generated/dataModel";

export type FeedbackPostType = "feature" | "bug";

export type FeedbackComment = {
  id: Id<"feedbackComments">;
  body: string;
  createdAt: number;
};

export type FeedbackPost = {
  id: Id<"feedbackPosts">;
  title: string;
  details: string;
  type: FeedbackPostType;
  score: number;
  commentCount?: number;
  createdAt: number;
  comments: FeedbackComment[];
};
