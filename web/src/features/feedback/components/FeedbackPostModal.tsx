"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Bug, Lightbulb, MessageSquareText, User, Palette, MoreVertical, Trash2, Edit2, BadgeCheck, X, Reply } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Badge } from "../../../components/ui/badge";
import { type FeedbackPost, type FeedbackPostType, type FeedbackComment } from "../types";
import { type Id } from "@convex/_generated/dataModel";
import { cn } from "../../../utils/cn";

type FeedbackPostModalProps = {
  post: FeedbackPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVote: (postId: FeedbackPost["id"], direction: "up" | "down") => Promise<void>;
  onComment: (postId: FeedbackPost["id"], body: string, parentId?: Id<"feedbackComments">) => Promise<boolean>;
  onEdit: (postId: FeedbackPost["id"], title: string, details: string, type: FeedbackPostType) => Promise<boolean>;
  onDelete: (postId: FeedbackPost["id"]) => Promise<boolean>;
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
  onEdit,
  onDelete,
}: FeedbackPostModalProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [editType, setEditType] = useState<FeedbackPostType>("feature");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<FeedbackComment | null>(null);

  useEffect(() => {
    if (open && post) {
      setEditTitle(post.title);
      setEditDetails(post.details);
      setEditType(post.type);
      setIsEditing(false);
    }
  }, [open, post]);

  if (!post) return null;

  const submitComment = async () => {
    if (isSubmitting || !comment.trim()) return;
    setIsSubmitting(true);
    try {
      const success = await onComment(post.id, comment, replyingTo?.id);
      if (success) {
        setComment("");
        setReplyingTo(null);
      } else {
        toast.error("Could not post comment. Please sign in and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden rounded-2xl border-border/60 bg-card p-0 sm:max-w-2xl">
        {/* Header */}
        <DialogHeader className="border-b border-border/50 px-5 py-4 sm:px-6 relative">
          {post.isOwner && !isEditing && (
            <div className="absolute top-4 right-12 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted outline-none">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {isEditing ? (
            <div className="space-y-3 mt-4 text-left">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-10 w-full rounded-xl border border-border/70 bg-background/70 px-3 text-sm outline-none ring-primary/40 focus:ring-2"
                placeholder="Post title"
                maxLength={120}
              />
              <textarea
                value={editDetails}
                onChange={(e) => setEditDetails(e.target.value)}
                className="min-h-28 w-full resize-y rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2"
                placeholder="Details..."
                maxLength={2000}
              />
              <div className="flex items-center gap-2">
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as FeedbackPostType)}
                  className="h-9 rounded-xl border border-border/70 bg-background/70 px-3 text-sm outline-none"
                >
                  <option value="feature">Feature Idea</option>
                  <option value="bug">Bug Report</option>
                  <option value="ui_ux">UI/UX</option>
                </select>
                <button
                  type="button"
                  className="h-9 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 ml-auto"
                  onClick={async () => {
                    const success = await onEdit(post.id, editTitle, editDetails, editType);
                    if (success) setIsEditing(false);
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="h-9 rounded-xl border border-border bg-card px-4 text-sm font-medium hover:bg-muted"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 pr-8">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    post.type === "feature"
                      ? "bg-amber-500/10 text-amber-500"
                      : post.type === "bug"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-purple-500/10 text-purple-500",
                  )}
                >
                  {post.type === "feature" ? (
                    <Lightbulb className="h-3 w-3" />
                  ) : post.type === "bug" ? (
                    <Bug className="h-3 w-3" />
                  ) : (
                    <Palette className="h-3 w-3" />
                  )}
                  {post.type === "ui_ux" ? "UI/UX" : post.type}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {formatRelativeTime(post.createdAt)}
                </span>
              </div>
              <DialogTitle className="text-base font-semibold sm:text-lg mt-1 pr-8">
                {post.title}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                {post.details}
              </DialogDescription>
            </>
          )}
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
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          {post.comments.length === 0 && (
            <p className="rounded-xl border border-dashed border-border/60 px-4 py-3 text-center text-xs text-muted-foreground">
              No comments yet. Be the first to share your thoughts.
            </p>
          )}
          {post.comments.filter(c => !c.parentId).map((item) => (
            <div key={item.id} className="flex flex-col gap-2">
              <div className="flex gap-3 rounded-xl border border-border/50 bg-background/60 px-3 py-3">
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold">{item.authorName}</span>
                    {item.isCommunityManager && (
                      <Badge variant="secondary" className="h-5 px-2 text-[10px] font-bold bg-primary/10 text-primary border-primary/20 gap-1">
                        <BadgeCheck className="h-3 w-3" />
                        Community Manager
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-1">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
                  <button 
                    onClick={() => setReplyingTo(item)}
                    className="mt-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Reply className="h-3 w-3" /> Reply
                  </button>
                </div>
              </div>

              {post.comments.filter(c => c.parentId === item.id).map(reply => (
                <div key={reply.id} className="flex gap-3 rounded-xl border border-border/50 bg-background/40 px-3 py-3 ml-8">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                    {reply.authorImage ? (
                      <Image
                        src={reply.authorImage}
                        alt={reply.authorName}
                        width={24}
                        height={24}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold">{reply.authorName}</span>
                    {reply.isCommunityManager && (
                      <Badge variant="secondary" className="h-5 px-2 text-[10px] font-bold bg-primary/10 text-primary border-primary/20 gap-1">
                        <BadgeCheck className="h-3 w-3" />
                        Community Manager
                      </Badge>
                    )}
                      <span className="text-[10px] text-muted-foreground ml-1">
                        {formatRelativeTime(reply.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{reply.body}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Comment composer */}
        <div className="border-t border-border/50 px-5 py-3 sm:px-6">
          {replyingTo && (
            <div className="mb-2 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-1.5">
              <span className="text-xs text-muted-foreground">
                Replying to <span className="font-semibold">{replyingTo.authorName}</span>
              </span>
              <button onClick={() => setReplyingTo(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
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

    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Post</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this post? This action cannot be undone and will permanently remove all associated comments and votes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={async () => {
              await onDelete(post.id);
              setIsDeleteDialogOpen(false);
              onOpenChange(false);
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
