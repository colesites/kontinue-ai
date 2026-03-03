"use client";

import { Moon, Sun, Palette, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { FaCircle } from "react-icons/fa6";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { THEMES, type Theme, getSavedTheme, setColorTheme, getThemeLabel, getThemePrimaryColor } from "@/lib/theme";

export function ModeToggle({ className }: { className?: string }) {
  const { theme: darkMode, setTheme: setDarkMode } = useTheme();
  const [colorTheme, setColorThemeState] = useState<Theme>(
    () => getSavedTheme() ?? "default",
  );

  const handleColorThemeChange = (theme: Theme) => {
    setColorTheme(theme);
    setColorThemeState(theme);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 items-center justify-center rounded-lg text-foreground/85 transition-colors hover:text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            className,
          )}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Sun className="h-4 w-4" />
          Mode
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => setDarkMode("light")}
          className="flex items-center justify-between"
        >
          <span>Light</span>
          {darkMode === "light" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setDarkMode("dark")}
          className="flex items-center justify-between"
        >
          <span>Dark</span>
          {darkMode === "dark" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setDarkMode("system")}
          className="flex items-center justify-between"
        >
          <span>System</span>
          {darkMode === "system" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Color Theme
        </DropdownMenuLabel>
        {THEMES.map((theme) => (
          <DropdownMenuItem
            key={theme}
            onClick={() => handleColorThemeChange(theme)}
            className="flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <FaCircle
                className="h-3 w-3"
                style={{ color: getThemePrimaryColor(theme) }}
                aria-hidden="true"
              />
              {getThemeLabel(theme)}
            </span>
            {colorTheme === theme && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
