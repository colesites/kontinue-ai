# Multi-Theme System Documentation

## Overview

This implementation adds a flexible multi-theme system to your Next.js app that works alongside dark mode. Users can choose color themes (Default, Emerald) and each theme supports both light and dark modes.

## Architecture

### Why This Approach?

1. **CSS Variable Switching**: We keep all theme colors as CSS variables and switch them by adding/removing classes on `<html>`. This is efficient and doesn't require CSS file loading.

2. **Single CSS File**: All themes live in `globals.css`. No need for separate files since we're just changing variable values, not entire stylesheets.

3. **Shadcn Token Mapping**: Your components use Tailwind classes like `bg-background`, `text-foreground`, etc. These map to CSS variables via the `@theme inline` block:
   - `bg-background` → `--color-background` → `var(--background)`
   - The `--background` value changes based on the theme class on `<html>`

4. **No Flash on Load**: An inline script in `<head>` reads localStorage and applies the theme class before React hydrates.

5. **Works with Dark Mode**: Dark mode (via next-themes) adds `.dark` class. Theme classes (`.theme-emerald`) work alongside it:
   - Light + Default: `:root` variables
   - Dark + Default: `.dark` variables
   - Light + Emerald: `html.theme-emerald` variables
   - Dark + Emerald: `html.theme-emerald.dark` variables

## File Structure

```
src/
├── app/
│   ├── globals.css              # All theme CSS variables
│   ├── layout.tsx               # Inline script for no-flash loading
│   └── providers.tsx            # Theme components wrapper
├── components/
│   ├── ModeToggle.tsx           # Enhanced with theme picker
│   ├── ThemeInit.tsx            # Client-side theme initialization
│   ├── ThemeOnboarding.tsx      # First-time theme selection modal
│   └── ui/
│       └── radio-group.tsx      # RadioGroup component for theme picker
└── lib/
    └── theme.ts                 # Theme utilities and types
```

## How It Works

### 1. Theme Storage (localStorage)

- **Key**: `ui-theme`
- **Values**: `"default"` | `"emerald"`
- **Onboarding Key**: `theme-onboarding-completed`

### 2. Theme Application Flow

```
Page Load
  ↓
Inline <script> reads localStorage
  ↓
Applies theme class to <html> (before React)
  ↓
React hydrates
  ↓
ThemeInit component syncs state
  ↓
ThemeOnboarding shows if first visit
```

### 3. CSS Cascade

```css
/* Default theme (no class needed) */
:root { --background: white; }
.dark { --background: dark-gray; }

/* Emerald theme */
html.theme-emerald { --background: white; }
html.theme-emerald.dark { --background: dark-green; }
```

The most specific selector wins, so theme classes override `:root` and `.dark`.

## Usage

### Switching Themes Programmatically

```typescript
import { setColorTheme } from "@/lib/theme";

// Change theme
setColorTheme("emerald");
setColorTheme("default");
```

### Getting Current Theme

```typescript
import { getSavedTheme } from "@/lib/theme";

const currentTheme = getSavedTheme(); // "default" | "emerald" | null
```

### Adding New Themes

1. **Add to theme list** (`src/lib/theme.ts`):
```typescript
export const THEMES = ["default", "emerald", "ocean"] as const;
```

2. **Add CSS variables** (`src/app/globals.css`):
```css
/* Ocean Theme - Light Mode */
html.theme-ocean {
  --radius: 0.5rem;
  --background: oklch(0.98 0.01 220);
  --foreground: oklch(0.15 0.02 220);
  --primary: oklch(0.55 0.20 220);
  /* ... all other variables ... */
}

/* Ocean Theme - Dark Mode */
html.theme-ocean.dark {
  --background: oklch(0.15 0.02 220);
  --foreground: oklch(0.95 0.01 220);
  --primary: oklch(0.65 0.18 220);
  /* ... all other variables ... */
}
```

3. **Update theme descriptions** (`src/components/ThemeOnboarding.tsx`):
```typescript
{theme === "ocean" && "Cool blue ocean tones"}
```

### Customizing Onboarding

The `ThemeOnboarding` component shows on first visit. To trigger it again:

```typescript
// In browser console or your code
localStorage.removeItem("theme-onboarding-completed");
```

To disable onboarding entirely, remove `<ThemeOnboarding />` from `src/app/providers.tsx`.

## Components

### ModeToggle

Enhanced dropdown that includes:
- Light/Dark/System mode toggle
- Color theme picker with checkmarks
- Separated sections for mode and theme

### ThemeOnboarding

Modal that appears on first visit:
- Shows all available themes
- Live preview as user selects
- Radio button selection
- Persists choice and marks onboarding complete

### ThemeInit

Silent component that:
- Runs on mount
- Reads saved theme from localStorage
- Applies theme class to `<html>`
- Ensures consistency after hydration

## Testing

### Manual Testing

1. **First Visit**:
   - Clear localStorage
   - Refresh page
   - Should see theme onboarding modal
   - Select a theme
   - Modal closes and theme applies

2. **Theme Persistence**:
   - Select Emerald theme
   - Refresh page
   - Should stay on Emerald theme

3. **Dark Mode + Theme**:
   - Select Emerald theme
   - Toggle to dark mode
   - Should see Emerald dark colors (greens)
   - Switch to Default theme
   - Should see Default dark colors (pinks/reds)

4. **No Flash**:
   - Select Emerald theme
   - Hard refresh (Cmd+Shift+R)
   - Should not see Default theme flash before Emerald loads

### Browser DevTools

Check applied classes:
```javascript
// Should show: "theme-emerald" (if Emerald selected)
document.documentElement.classList

// Should show: "emerald" or "default"
localStorage.getItem("ui-theme")
```

## Troubleshooting

### Theme not applying on load

Check the inline script in `src/app/layout.tsx`:
```typescript
<script dangerouslySetInnerHTML={{
  __html: `(function() { /* ... */ })();`
}} />
```

This must be in `<head>` before `<body>`.

### Theme flashing on load

The inline script might not be running early enough. Ensure:
1. Script is in `<head>`, not `<body>`
2. No errors in browser console
3. localStorage is accessible (not blocked by privacy settings)

### Onboarding showing every time

Check if localStorage is being cleared:
```javascript
localStorage.getItem("theme-onboarding-completed") // should be "true"
```

### Colors not changing

1. Check CSS specificity - theme classes must be on `<html>`
2. Verify all variables are defined in theme blocks
3. Check browser DevTools computed styles

## Adding More Themes

To add a "Sunset" theme with orange/purple tones:

1. Update `src/lib/theme.ts`:
```typescript
export const THEMES = ["default", "emerald", "sunset"] as const;
```

2. Add to `src/app/globals.css`:
```css
html.theme-sunset {
  --primary: oklch(0.65 0.22 40); /* Orange */
  --accent: oklch(0.60 0.18 300); /* Purple */
  /* ... all other variables ... */
}

html.theme-sunset.dark {
  --primary: oklch(0.70 0.20 40);
  --accent: oklch(0.65 0.16 300);
  /* ... all other variables ... */
}
```

3. Update `src/components/ThemeOnboarding.tsx`:
```typescript
{theme === "sunset" && "Warm sunset orange & purple"}
```

That's it! The theme will automatically appear in both ModeToggle and ThemeOnboarding.

## Performance

- **No extra HTTP requests**: All CSS in one file
- **No runtime CSS generation**: Just class toggling
- **Minimal JavaScript**: ~2KB for theme utilities
- **No flash**: Inline script runs before paint
- **CSS variables**: Native browser feature, very fast

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires CSS custom properties support
- Requires localStorage support
- OKLCH colors (fallback to sRGB in older browsers)

## Future Enhancements

Possible additions:
- User-created custom themes
- Theme preview before applying
- Sync theme across devices (requires backend)
- Per-page theme overrides
- Animated theme transitions
- Theme scheduling (auto-switch at certain times)
