import { useState } from "react";
import { X, Sparkles, Link2 } from "lucide-react";
import { HowToStep } from "./HowToStep";

export function HowToButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
      >
        How does this work?
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden text-left">
            <div className="h-1 bg-linear-to-r from-primary via-accent to-secondary" />
            <div className="p-6">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  How it works
                </h2>
              </div>
              <div className="space-y-4">
                <HowToStep
                  icon={<Sparkles size={18} />}
                  title="Continue"
                  description="Choose GPT / Claude / Gemini and keep going."
                />
                <HowToStep
                  icon={<Link2 size={18} />}
                  title="Paste a shared link"
                  description="We'll automatically scrape the conversation from ChatGPT, Claude, or Gemini."
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
