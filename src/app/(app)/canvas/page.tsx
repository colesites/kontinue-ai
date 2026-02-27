"use client";

import { useCanvas } from "./hooks/use-canvas";
import { CanvasHeader } from "./components/CanvasHeader";
import { CanvasGallery } from "./components/CanvasGallery";
import { CanvasInputBar } from "./components/CanvasInputBar";
import { CreationLightbox } from "./components/CreationLightbox";

export default function CanvasPage() {
  const {
    tab,
    setTab,
    isGenerating,
    expandedCreation,
    setExpandedCreation,
    displayCreations,
    credits,
    myLikes,
    publishingIds,
    handleGenerate,
    handleToggleLike,
    handlePublish,
    isPro,
    canGenerateImages,
    canGenerateVideos,
  } = useCanvas();

  return (
    <div className="relative min-h-screen bg-background text-foreground pb-32">
      <CanvasHeader tab={tab} setTab={setTab} />

      <main className="w-full">
        <CanvasGallery
          items={displayCreations}
          tab={tab}
          myLikes={myLikes}
          publishingIds={publishingIds}
          onToggleLike={handleToggleLike}
          onExpand={setExpandedCreation}
          onPublish={handlePublish}
        />
      </main>

      {expandedCreation && (
        <CreationLightbox
          creation={expandedCreation}
          isLiked={myLikes.has(expandedCreation._id)}
          onClose={() => setExpandedCreation(null)}
          onToggleLike={handleToggleLike}
        />
      )}

      <CanvasInputBar
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        credits={{
          remaining: credits?.remaining ?? 300,
          total: credits?.total ?? 300,
        }}
        canGenerateImages={canGenerateImages}
        canGenerateVideos={canGenerateVideos}
        isPro={isPro}
      />
    </div>
  );
}
