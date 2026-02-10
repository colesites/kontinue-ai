# Image Generation Feature Fixes

## Overview
Fixed the image generation feature to properly work with both OpenAI and Google Gemini image-capable models, and added a custom image placeholder loader (similar to Gemini's UI) instead of just showing a "Thinking" loader.

## Issues Fixed

### 1. **Images Not Displaying**
   - **Problem**: Google Gemini image models (like `google/gemini-2.5-flash-image` and `google/gemini-3-pro-image`) were not properly displaying generated images
   - **Root Cause**: The code was only handling OpenAI's tool-based image generation, but Google models generate images natively through the stream with `file` type parts
   - **Solution**: Added proper handling for `file` type parts in the message stream, including both URL-based and data-based formats

### 2. **Wrong Loader Displayed**
   - **Problem**: When generating images, it showed a generic "Thinking" loader with spinning icon
   - **User Requirement**: Show an image placeholder loader (like Gemini) specifically for image generation
   - **Solution**: Created `ImageGenerationLoader` component with animated placeholder and shimmer effect

### 3. **Type Errors**
   - **Problem**: TypeScript errors with `gateway.tools` imports
   - **Solution**: Fixed imports to use `@ai-sdk/gateway` package correctly

## Files Changed

### New Files Created

#### 1. `src/features/chat/components/ImageGenerationLoader.tsx`
A dedicated loader component for image generation that displays:
- An image icon with pulse animation
- "Generating image" text with animated dots
- A 264x264 dashed border placeholder box
- Animated shimmer effect across the placeholder
- Grid pattern overlay for visual texture

#### 2. `src/app/globals.css` (Updated)
Added `shimmer` keyframe animation for the image loader's shimmer effect.

### Modified Files

#### 1. `src/features/chat/components/ChatClient.tsx`
**Key Changes:**
- Imported `ImageGenerationLoader` component
- Imported `useModelCapabilities` hook to detect image-capable models
- Added `isGeneratingImage` state to track when image generation is in progress
- Added logic to detect if current model supports image generation
- Added pattern matching to detect if user's message is requesting an image
- Added `useEffect` to update `isGeneratingImage` state based on status and message content
- Enhanced message part handling to support Google Gemini's native image generation:
  - Handles `file` type parts with URL
  - Handles `file` type parts with data/uint8Array (converts to base64 data URL)
  - Maintains existing OpenAI tool-based image handling
- Updated loader rendering to show `ImageGenerationLoader` when generating images, or default "Thinking" loader otherwise

#### 2. `src/app/api/chat/route.ts`
**Key Changes:**
- Fixed `gateway` import to come from `@ai-sdk/gateway` instead of `ai` package
- Added type assertions to resolve TypeScript issues with `gateway.tools.perplexitySearch()`
- Fixed spread operator issue with optional tool configuration
- Maintained existing logic for:
  - OpenAI models using `image_generation` tool
  - Google Gemini models generating images natively (no tool needed)
  - Strong prompting to encourage actual image generation

## How It Works Now

### For OpenAI Models (e.g., `openai/gpt-5.1-instant`)
1. When image generation is requested, the `image_generation` tool is added
2. Model calls the tool and returns base64 image data in tool results
3. Images are extracted from `tool-result` or `tool-image_generation` parts
4. Converted to data URLs and displayed

### For Google Gemini Models (e.g., `google/gemini-2.5-flash-image`, `google/gemini-3-pro-image`)
1. No tool is added - these models generate images natively
2. Images come through the stream as `file` type parts
3. Can include either:
   - `url` property (direct data URL)
   - `data` property with `Uint8Array` (converted to base64 data URL)
4. Images are extracted and displayed automatically

### Image Generation Detection
The system now intelligently detects when to show the image loader by checking:
1. **Model capability**: Does the selected model support image generation?
2. **User intent**: Does the message contain image-related keywords (image, picture, draw, illustration, generate, create, render, photo, paint, sketch, depict, show me, make me)?
3. **Status**: Is the model currently processing (submitted/streaming)?

When all conditions are met, the custom `ImageGenerationLoader` is shown instead of the generic thinking loader.

### Visual Improvements
- Image generation now shows a distinct visual indicator (placeholder box with shimmer)
- Users immediately understand an image is being generated
- Matches UX patterns from other AI tools like Gemini
- Placeholder provides spatial context for where the image will appear

## Technical Details

### Message Part Types Handled
```typescript
// File parts (Google Gemini native)
{ type: "file", url: string } // Direct data URL
{ type: "file", data: Uint8Array, mimeType?: string } // Binary data

// Tool result parts (OpenAI)
{ type: "tool-image_generation", output: { result: string } } // Typed tool result
{ type: "tool-result", toolName: "image_generation", output: { result: string } } // Generic tool result
```

### Image Format Support
- **OpenAI**: Returns base64-encoded WebP images
- **Google Gemini**: Returns images in various formats (PNG, JPEG, WebP) as data URLs or binary data

### Browser Compatibility
- Uses standard `btoa()` for base64 encoding
- All images displayed as data URLs (no external requests needed)
- Shimmer animation uses CSS transforms (widely supported)

## Testing Recommendations

1. **Test OpenAI image models:**
   - Select `openai/gpt-5.1-instant` or similar
   - Ask: "Generate an image of a sunset over mountains"
   - Verify: Image loader shows, then image appears

2. **Test Google Gemini image models:**
   - Select `google/gemini-2.5-flash-image` or `google/gemini-3-pro-image`
   - Ask: "Create a picture of a cat"
   - Verify: Image loader shows, then image appears

3. **Test non-image requests:**
   - Select any image-capable model
   - Ask: "What is the capital of France?"
   - Verify: Regular "Thinking" loader shows (not image loader)

4. **Test non-image models:**
   - Select a text-only model
   - Ask for an image
   - Verify: Model responds that it cannot generate images (as expected)

## Known Limitations

1. **Image aspect ratio**: Currently controlled via UI settings, not all models respect these
2. **Multiple images**: Some models can generate multiple images per response - all are displayed in a flex row
3. **Large images**: Very large images may take time to encode/decode - consider adding loading states for image data
4. **Streaming**: Images only appear after generation completes (not progressively)

## Future Enhancements

1. Add progressive image loading indicators
2. Support image editing/refinement workflows
3. Add image download buttons
4. Support for image-to-image generation
5. Image gallery view for multiple generated images
6. Caching of generated images in Convex database