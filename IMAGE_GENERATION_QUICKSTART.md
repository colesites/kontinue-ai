# Image Generation Quick Start Guide

## How to Generate Images

### 1. Select an Image-Capable Model

Look for models with the "Image Gen" badge in the model selector:

**OpenAI Models:**
- `openai/gpt-5.1-instant`
- `openai/gpt-5.2`
- Other GPT-5 variants

**Google Gemini Models:**
- `google/gemini-2.5-flash-image`
- `google/gemini-2.5-flash-image-preview`
- `google/gemini-3-pro-image`

### 2. Ask for an Image

Simply type your request naturally. Examples:

- "Generate an image of a sunset over mountains"
- "Create a picture of a cat wearing a hat"
- "Draw an illustration of a futuristic city"
- "Show me a watercolor painting of a forest"
- "Render a photo of a sports car"

### 3. Watch the Magic Happen

You'll see a special image placeholder loader with:
- A dashed border box
- An animated shimmer effect
- "Generating image" text

This is different from the regular "Thinking" loader, so you know an image is being created.

### 4. View Your Image

Once generation completes, the image appears in the chat. You can:
- View it inline
- Copy the message (includes image URL)
- Continue the conversation

## Tips for Better Results

### Be Specific
❌ "Make a dog"
✅ "Generate a golden retriever puppy sitting in a garden with flowers, golden hour lighting"

### Describe Style
- "photorealistic"
- "watercolor painting"
- "digital art"
- "pencil sketch"
- "oil painting"

### Specify Details
- Lighting: "sunset", "soft lighting", "dramatic shadows"
- Mood: "peaceful", "energetic", "mysterious"
- Composition: "close-up", "wide angle", "aerial view"
- Colors: "vibrant colors", "pastel tones", "monochrome"

## Image Settings (OpenAI Models Only)

For OpenAI models, you can adjust:

**Aspect Ratio:**
- Auto (default)
- 1:1 (square)
- 16:9 (landscape)
- 9:16 (portrait)
- 4:3
- 3:4

**Size Presets:**
- Default
- 1024×1024
- 1536×1024
- 1024×1536

*Note: Google Gemini models generate images at their default sizes and may not respect these settings.*

## Troubleshooting

### "I can't generate images" Response
**Problem:** Model says it cannot generate images.
**Solutions:**
1. Make sure you selected an image-capable model (look for "Image Gen" badge)
2. Try rewording your request to be more explicit
3. For OpenAI models, try forcing the tool by using keywords like "generate image" or "create picture"

### Only Text, No Image
**Problem:** Model describes an image but doesn't generate one.
**Solutions:**
1. Be more direct: "Generate an image of..." instead of "Describe..."
2. Use action words: "create", "generate", "draw", "render", "make"
3. Try a different model (Gemini models are often more consistent)

### Image Takes Too Long
**Problem:** Stuck on "Generating image" for over 30 seconds.
**Possible Causes:**
1. Server timeout (function limit is 60 seconds)
2. High load on the provider
3. Complex prompt requiring multiple attempts

**What to Do:**
- Wait up to 60 seconds
- If it times out, try again with a simpler prompt
- Try a different model

### Wrong Aspect Ratio
**Problem:** Image doesn't match selected aspect ratio.
**Explanation:**
- OpenAI models generally respect aspect ratio settings
- Google Gemini models have fixed output sizes
- Some models interpret the request creatively

## Model Comparison

| Model | Speed | Quality | Aspect Control | Best For |
|-------|-------|---------|----------------|----------|
| `google/gemini-2.5-flash-image` | ⚡⚡⚡ Fast | ⭐⭐⭐ Good | ❌ No | Quick iterations, concepts |
| `google/gemini-3-pro-image` | ⚡⚡ Medium | ⭐⭐⭐⭐⭐ Excellent | ❌ No | High-quality final images |
| `openai/gpt-5.1-instant` | ⚡⚡⚡ Fast | ⭐⭐⭐⭐ Very Good | ✅ Yes | Controlled compositions |
| `openai/gpt-5.2` | ⚡⚡ Medium | ⭐⭐⭐⭐ Very Good | ✅ Yes | Complex scenes |

## Examples

### Simple Request
```
User: "Generate an image of a red apple"
```
Result: Clean image of a red apple, neutral background

### Detailed Request
```
User: "Create a photorealistic image of a red apple on a wooden table, 
natural window lighting from the left, shallow depth of field, 
professional food photography style"
```
Result: Professional-quality image with specified lighting and composition

### Artistic Style
```
User: "Draw a watercolor painting of a peaceful lake at sunrise, 
soft pastel colors, impressionist style"
```
Result: Artistic interpretation matching the style description

### Multiple Elements
```
User: "Generate an image showing a modern coffee shop interior, 
people working on laptops, plants by the windows, warm lighting, 
cozy atmosphere"
```
Result: Complex scene with multiple elements composed together

## Best Practices

1. **Start Simple**: Test with basic requests first
2. **Iterate**: Refine your prompt based on results
3. **Use Examples**: Reference known styles or photographers
4. **Be Patient**: High-quality images take time
5. **Save Good Prompts**: Keep note of prompts that work well

## Technical Notes

- Images are returned as base64-encoded data URLs
- No external image hosting is used
- Images are displayed inline in the chat
- Multiple images per response are supported (shown side-by-side)
- Images persist in your chat history

## Getting Help

If you encounter persistent issues:
1. Check that your model supports image generation
2. Verify your prompt includes clear image generation keywords
3. Try a different image-capable model
4. Check the browser console for errors
5. Ensure you have an active Pro plan if using premium models

---

Happy generating! 🎨