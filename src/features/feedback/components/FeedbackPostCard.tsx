"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Bug, Lightbulb, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { type FeedbackPost } from "@/features/feedback/types";
import { cn } from "@/utils/cn";

type FeedbackPostCardProps = {
  post: FeedbackPost;
  onVote: (postId: FeedbackPost["id"], direction: "up" | "down") => Promise<void>;
  onComment: (postId: FeedbackPost["id"], body: string) => Promise<boolean>;
};

function formatRelativeTime(createdAt: number): string {
  const elapsedMs = Date.now() - createdAt;
  const elapsedMinutes = Math.max(1, Math.floor(elapsedMs / 60_000));
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  return `${Math.floor(elapsedHours / 24)}d ago`;
}

export function FeedbackPostCard({ post, onVote, onComment }: FeedbackPostCardProps) {
  const [comment, setComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(true);

  const submitComment = async () => {
    if (isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const didSubmit = await onComment(post.id, comment);
      if (didSubmit) {
        setComment("");
        setShowComments(true);
      } else if (comment.trim()) {
        toast.error("Could not post comment. Please sign in and try again.");
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <article className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {post.type === "feature" ? (
              <Lightbulb className="h-3.5 w-3.5" />
            ) : (
              <Bug className="h-3.5 w-3.5" />
            )}
            {post.type}
          </p>
          <h3 className="mt-1 text-sm font-semibold sm:text-base">{post.title}</h3>
          <p className="mt-2 text-xs text-muted-foreground sm:text-sm">{post.details}</p>
        </div>
        <div className="text-[11px] text-muted-foreground">
          {formatRelativeTime(post.createdAt)}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => void onVote(post.id, "up")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/70"
          aria-label="Upvote"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-8 text-center text-sm font-semibold">{post.score}</span>
        <button
          type="button"
          onClick={() => void onVote(post.id, "down")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/70"
          aria-label="Downvote"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setShowComments((previous) => !previous)}
          className="ml-auto rounded-lg border border-border/70 bg-background/60 px-2 py-1 text-[11px] text-muted-foreground"
        >
          {showComments ? "Hide" : "View"} comments ({post.comments.length})
        </button>
      </div>

      {showComments && (
        <div className="mt-4 space-y-2">
          {post.comments.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border/50 bg-background/60 px-3 py-2 text-xs text-muted-foreground"
            >
              <MessageSquareText className="mr-1 inline h-3.5 w-3.5" />
              {item.body}
            </div>
          ))}
          {post.comments.length === 0 && (
            <p className="rounded-xl border border-dashed border-border/70 bg-background/50 px-3 py-2 text-xs text-muted-foreground">
              No comments yet.
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void submitComment();
            }
          }}
          className={cn(
            "h-9 flex-1 rounded-xl border border-border/60 bg-background/70 px-3 text-xs outline-none ring-primary/40 focus:ring-2",
          )}
          placeholder="Add a comment..."
          maxLength={500}
        />
        <button
          type="button"
          onClick={() => void submitComment()}
          disabled={isSubmittingComment}
          className="h-9 rounded-xl border border-border/70 bg-background/70 px-3 text-xs font-medium"
        >
          {isSubmittingComment ? "Posting..." : "Comment"}
        </button>
      </div>
    </article>
  );
}
