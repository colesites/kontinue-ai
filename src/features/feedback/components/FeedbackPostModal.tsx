"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Bug, Lightbulb, MessageSquareText, User } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { type FeedbackPost } from "@/features/feedback/types";
import { cn } from "@/utils/cn";

type FeedbackPostModalProps = {
  post: FeedbackPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVote: (postId: FeedbackPost["id"], direction: "up" | "down") => Promise<void>;
  onComment: (postId: FeedbackPost["id"], body: string) => Promise<boolean>;
};

function formatRelativeTime(createdAt: number): string {
  const elapsedMs = Date.now() - createdAt;
  if (elapsedMs < 60_000) return "just now";
  const elapsedMinutes = Math.floor(elapsedMs / 60_000);
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  return `${Math.floor(elapsedHours / 24)}d ago`;
}

export function FeedbackPostModal({
  post,
  open,
  onOpenChange,
  onVote,
  onComment,
}: FeedbackPostModalProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!post) return null;

  const submitComment = async () => {
    if (isSubmitting || !comment.trim()) return;
    setIsSubmitting(true);
    try {
      const success = await onComment(post.id, comment);
      if (success) {
        setComment("");
      } else {
        toast.error("Could not post comment. Please sign in and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden rounded-2xl border-border/60 bg-card p-0 sm:max-w-2xl">
        {/* Header */}
        <DialogHeader className="border-b border-border/50 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                post.type === "feature"
                  ? "bg-amber-500/10 text-amber-500"
                  : "bg-red-500/10 text-red-500",
              )}
            >
              {post.type === "feature" ? (
                <Lightbulb className="h-3 w-3" />
              ) : (
                <Bug className="h-3 w-3" />
              )}
              {post.type}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
          <DialogTitle className="text-base font-semibold sm:text-lg">
            {post.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {post.details}
          </DialogDescription>
        </DialogHeader>

        {/* Vote strip */}
        <div className="flex items-center gap-3 border-b border-border/50 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => void onVote(post.id, "up")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/70 transition-colors hover:bg-primary/10 hover:text-primary"
            aria-label="Upvote"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-6 text-center text-sm font-semibold">{post.score}</span>
          <button
            type="button"
            onClick={() => void onVote(post.id, "down")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Downvote"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <span className="ml-auto text-xs text-muted-foreground">
            {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
          </span>
        </div>

        {/* Comments list */}
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 sm:px-6">
          {post.comments.length === 0 && (
            <p className="rounded-xl border border-dashed border-border/60 px-4 py-3 text-center text-xs text-muted-foreground">
              No comments yet. Be the first to share your thoughts.
            </p>
          )}
          {post.comments.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 rounded-xl border border-border/50 bg-background/60 px-3 py-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                {item.authorImage ? (
                  <Image
                    src={item.authorImage}
                    alt={item.authorName}
                    width={32}
                    height={32}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold">{item.authorName}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Comment composer */}
        <div className="border-t border-border/50 px-5 py-3 sm:px-6">
          <div className="flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void submitComment();
                }
              }}
              className="h-9 flex-1 rounded-xl border border-border/60 bg-background/70 px-3 text-xs outline-none ring-primary/40 placeholder:text-muted-foreground/60 focus:ring-2"
              placeholder="Write a comment..."
              maxLength={500}
            />
            <button
              type="button"
              onClick={() => void submitComment()}
              disabled={isSubmitting || !comment.trim()}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-medium transition-opacity",
                comment.trim()
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "border border-border/70 bg-background/70 text-muted-foreground",
              )}
            >
              <MessageSquareText className="h-3.5 w-3.5" />
              {isSubmitting ? "Posting..." : "Comment"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
