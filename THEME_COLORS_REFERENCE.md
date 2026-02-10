# Theme Colors Reference

## Default Theme (Pink/Red)

### Light Mode
- **Primary**: Pink/Red (`oklch(0.624 0.255 352)`)
- **Background**: White (`oklch(1 0 0)`)
- **Foreground**: Dark gray (`oklch(0.144 0.004 340)`)
- **Accent**: Orange (`oklch(0.747 0.113 12.6)`)
- **Vibe**: Classic, professional, warm

### Dark Mode
- **Primary**: Pink (`oklch(0.63 0.239 349)`)
- **Background**: Very dark gray (`oklch(0.142 0.01 346)`)
- **Foreground**: Off-white (`oklch(0.96 0.003 340)`)
- **Accent**: Dark gray (`oklch(0.27 0.038 338)`)
- **Vibe**: Sleek, modern, sophisticated

## Emerald Theme (Green/Teal)

### Light Mode
- **Primary**: Bright emerald green (`oklch(0.813 0.256 142)`)
- **Background**: White (`oklch(1 0 0)`)
- **Foreground**: Dark green-gray (`oklch(0.148 0.005 143)`)
- **Accent**: Teal (`oklch(0.882 0.083 158.5)`)
- **Vibe**: Fresh, natural, energetic

### Dark Mode
- **Primary**: Vibrant emerald (`oklch(0.802 0.220 142)`)
- **Background**: Dark green-gray (`oklch(0.205 0.029 142)`)
- **Foreground**: Off-white (`oklch(0.963 0.004 143)`)
- **Accent**: Bright teal (`oklch(0.811 0.170 154)`)
- **Vibe**: Calm, nature-inspired, modern

## Color Token Mapping

All themes define these tokens:

### Layout
- `--background` - Main background color
- `--foreground` - Main text color
- `--card` - Card background
- `--card-foreground` - Card text
- `--popover` - Popover background
- `--popover-foreground` - Popover text

### Interactive
- `--primary` - Primary buttons, links
- `--primary-foreground` - Text on primary elements
- `--secondary` - Secondary buttons
- `--secondary-foreground` - Text on secondary elements
- `--accent` - Accent highlights
- `--accent-foreground` - Text on accent elements

### Utility
- `--muted` - Muted backgrounds
- `--muted-foreground` - Muted text
- `--destructive` - Error/delete actions
- `--border` - Border color
- `--input` - Input border color
- `--ring` - Focus ring color

### Charts
- `--chart-1` through `--chart-5` - Data visualization colors

### Sidebar
- `--sidebar` - Sidebar background
- `--sidebar-foreground` - Sidebar text
- `--sidebar-primary` - Sidebar primary elements
- `--sidebar-primary-foreground` - Text on sidebar primary
- `--sidebar-accent` - Sidebar accent
- `--sidebar-accent-foreground` - Text on sidebar accent
- `--sidebar-border` - Sidebar borders
- `--sidebar-ring` - Sidebar focus rings

## OKLCH Color Format

All colors use OKLCH format: `oklch(L C H)`

- **L** (Lightness): 0-1 (0 = black, 1 = white)
- **C** (Chroma): 0-0.4 (0 = gray, higher = more saturated)
- **H** (Hue): 0-360 degrees
  - 0° = Red
  - 120° = Green
  - 142° = Emerald (our Emerald theme)
  - 240° = Blue
  - 300° = Purple
  - 340-352° = Pink/Red (our Default theme)

### Why OKLCH?

- **Perceptually uniform**: Equal changes in values = equal visual changes
- **Better than HSL**: More accurate color representation
- **Wide gamut**: Can represent more colors than sRGB
- **Future-proof**: Modern CSS standard

## Creating New Theme Colors

### Step 1: Choose a Hue
Pick a hue angle (0-360):
- Red: 0-30°
- Orange: 30-60°
- Yellow: 60-90°
- Green: 90-150°
- Cyan: 150-210°
- Blue: 210-270°
- Purple: 270-330°
- Pink: 330-360°

### Step 2: Define Primary Color
```css
--primary: oklch(0.65 0.22 [YOUR_HUE]);
```
- Lightness: 0.6-0.7 for good contrast
- Chroma: 0.2-0.26 for vibrant but not overwhelming

### Step 3: Create Palette
Use the same hue with varying lightness:
```css
/* Light mode */
--background: oklch(1 0 [HUE]);           /* White */
--foreground: oklch(0.15 0.01 [HUE]);    /* Dark */
--primary: oklch(0.65 0.22 [HUE]);       /* Vibrant */
--muted: oklch(0.95 0.01 [HUE]);         /* Light gray */

/* Dark mode */
--background: oklch(0.15 0.02 [HUE]);    /* Dark */
--foreground: oklch(0.96 0.01 [HUE]);    /* Light */
--primary: oklch(0.70 0.20 [HUE]);       /* Slightly lighter */
--muted: oklch(0.30 0.04 [HUE]);         /* Medium gray */
```

### Step 4: Test Contrast
Ensure WCAG AA compliance:
- Normal text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio
- Use browser DevTools to check

## Example: Creating "Ocean" Theme (Blue)

```css
/* Ocean Theme - Light Mode */
html.theme-ocean {
  --radius: 0.5rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.15 0.01 220);
  --primary: oklch(0.55 0.20 220);        /* Blue */
  --primary-foreground: oklch(0.98 0.01 220);
  --secondary: oklch(0.95 0.01 220);
  --secondary-foreground: oklch(0.20 0.02 220);
  --muted: oklch(0.95 0.01 220);
  --muted-foreground: oklch(0.50 0.10 220);
  --accent: oklch(0.70 0.15 200);         /* Cyan accent */
  --accent-foreground: oklch(0.15 0.02 200);
  --destructive: oklch(0.58 0.237 28);
  --border: oklch(0.88 0.02 220);
  --input: oklch(0.88 0.02 220);
  --ring: oklch(0.55 0.20 220);
  /* ... charts and sidebar ... */
}

/* Ocean Theme - Dark Mode */
html.theme-ocean.dark {
  --background: oklch(0.15 0.02 220);
  --foreground: oklch(0.96 0.01 220);
  --primary: oklch(0.65 0.18 220);
  --primary-foreground: oklch(0.96 0.01 220);
  --secondary: oklch(0.25 0.03 220);
  --secondary-foreground: oklch(0.96 0.01 220);
  --muted: oklch(0.25 0.03 220);
  --muted-foreground: oklch(0.70 0.05 220);
  --accent: oklch(0.75 0.14 200);
  --accent-foreground: oklch(0.96 0.01 200);
  --destructive: oklch(0.58 0.237 28);
  --border: oklch(0.30 0.05 220);
  --input: oklch(0.30 0.05 220);
  --ring: oklch(0.65 0.18 220);
  /* ... charts and sidebar ... */
}
```

## Tips for Theme Creation

1. **Stay Consistent**: Use the same hue throughout (±10° variation for accents)
2. **Test Both Modes**: Ensure colors work in light and dark
3. **Check Accessibility**: Use contrast checkers
4. **Consider Context**: Professional apps = muted, creative apps = vibrant
5. **Test on Devices**: Colors look different on various screens
6. **Use Real Content**: Test with actual UI components, not just swatches

## Color Psychology

- **Red/Pink**: Energy, passion, urgency
- **Orange**: Creativity, enthusiasm, warmth
- **Yellow**: Optimism, clarity, attention
- **Green**: Growth, harmony, nature
- **Blue**: Trust, calm, professionalism
- **Purple**: Luxury, creativity, wisdom
- **Gray**: Neutral, sophisticated, modern

Choose colors that match your app's purpose and audience.
