"use client";

import { useState, useEffect } from "react";
import { Palette, Check } from "lucide-react";
import { FaCircle } from "react-icons/fa6";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  THEMES,
  type Theme,
  setColorTheme,
  hasCompletedThemeOnboarding,
  markThemeOnboardingComplete,
  getThemeLabel,
  getThemePrimaryColor,
} from "@/lib/theme";

interface ThemeOnboardingProps {
  onComplete?: () => void;
}

export function ThemeOnboarding({ onComplete }: ThemeOnboardingProps) {
  const [open, setOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<Theme>("default");

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = hasCompletedThemeOnboarding();
    if (!completed) {
      // Small delay to ensure proper mounting
      setTimeout(() => setOpen(true), 500);
    }
  }, []);

  const handleContinue = () => {
    setColorTheme(selectedTheme);
    markThemeOnboardingComplete();
    setOpen(false);
    onComplete?.();
  };

  const handleThemePreview = (theme: Theme) => {
    setSelectedTheme(theme);
    setColorTheme(theme);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Palette className="h-6 w-6 text-primary" />
            Choose Your Theme
          </DialogTitle>
          <DialogDescription>
            Select a color theme to personalize your experience. You can change this anytime from the theme menu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={selectedTheme} onValueChange={handleThemePreview}>
            {THEMES.map((theme) => (
              <label
                key={theme}
                htmlFor={theme}
                className={`
                  flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer
                  transition-all hover:border-primary/50
                  ${selectedTheme === theme ? "border-primary bg-primary/5" : "border-border"}
                `}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={theme} id={theme} />
                  <div className="flex flex-col">
                    <span className="flex items-center gap-2 font-medium">
                      <FaCircle
                        className="h-3 w-3"
                        style={{ color: getThemePrimaryColor(theme) }}
                        aria-hidden="true"
                      />
                      {getThemeLabel(theme)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {theme === "default" && "Classic pink & red tones"}
                      {theme === "emerald" && "Fresh green & teal vibes"}
                      {theme === "chelsea" && "Royal blue with gold accents"}
                    </span>
                  </div>
                </div>
                {selectedTheme === theme && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={handleContinue} className="w-full sm:w-auto">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
