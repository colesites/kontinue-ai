"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { FeedbackComposer } from "@/features/feedback/components/FeedbackComposer";
import { FeedbackPostCard } from "@/features/feedback/components/FeedbackPostCard";
import { useFeedbackBoard } from "@/features/feedback/hooks/useFeedbackBoard";

export function FeedbackBoardPage() {
  const router = useRouter();
  const { form, isLoading, topPosts, newPosts, updateForm, createPost, votePost, addComment } =
    useFeedbackBoard();

  const goBack = () => {
    router.push("/");
  };

  const publishPost = async () => {
    if (!form.title.trim() || !form.details.trim()) {
      toast.error("Add both title and details before publishing.");
      return;
    }

    const created = await createPost();
    if (!created) {
      toast.error("Could not publish post. Please sign in and try again.");
      return;
    }
    toast.success("Posted successfully.");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/50 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-card hover:text-foreground sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Kontinue AI
          </button>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
            Feedback Beta
          </span>
        </div>

        <section className="rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card/90 to-background p-5 shadow-sm sm:p-7">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Feedback Board
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Post feature ideas or bug reports, vote on what matters most, and
            discuss with the community.
          </p>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <FeedbackComposer
              title={form.title}
              details={form.details}
              type={form.type}
              onTitleChange={(value) => updateForm({ title: value })}
              onDetailsChange={(value) => updateForm({ details: value })}
              onTypeChange={(value) => updateForm({ type: value })}
              onSubmit={publishPost}
            />

            <section className="space-y-3">
              <div>
                <h2 className="text-base font-semibold">Top</h2>
                <p className="text-xs text-muted-foreground">
                  Sorted by highest vote score.
                </p>
              </div>
              {topPosts.map((post) => (
                <FeedbackPostCard
                  key={`top-${post.id}`}
                  post={post}
                  onVote={votePost}
                  onComment={addComment}
                />
              ))}
              {!isLoading && topPosts.length === 0 && (
                <p className="rounded-xl border border-dashed border-border/70 bg-card/50 px-4 py-3 text-xs text-muted-foreground">
                  No feedback yet. Be the first to post.
                </p>
              )}
            </section>
          </div>

          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">New</h2>
              <p className="text-xs text-muted-foreground">
                Sorted by most recent posts.
              </p>
            </div>
            {newPosts.map((post) => (
              <FeedbackPostCard
                key={`new-${post.id}`}
                post={post}
                onVote={votePost}
                onComment={addComment}
              />
            ))}
            {!isLoading && newPosts.length === 0 && (
              <p className="rounded-xl border border-dashed border-border/70 bg-card/50 px-4 py-3 text-xs text-muted-foreground">
                No feedback yet. Be the first to post.
              </p>
            )}
            {isLoading && (
              <p className="rounded-xl border border-dashed border-border/70 bg-card/50 px-4 py-3 text-xs text-muted-foreground">
                Loading posts...
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
