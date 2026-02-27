import { auth } from "@clerk/nextjs/server";
import { experimental_generateVideo as generateVideo } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { VIDEO_MODELS } from "@/lib/canvas-models";
import { fetchAiGatewayModels } from "@/lib/model-capabilities";

export const maxDuration = 300; // Video gen can take minutes

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      prompt?: string;
      model?: string;
      aspectRatio?: string;
      duration?: number;
      quality?: "standard" | "pro";
      audio?: boolean;
    };

    if (!body.prompt || body.prompt.trim().length < 3) {
      return NextResponse.json(
        { error: "Prompt is required (min 3 characters)" },
        { status: 400 },
      );
    }

    const modelId = body.model ?? VIDEO_MODELS[0].id;
    const validModel = VIDEO_MODELS.find((m) => m.id === modelId);
    if (!validModel) {
      return NextResponse.json(
        { error: `Invalid video model: ${modelId}` },
        { status: 400 },
      );
    }

    const duration = body.duration ?? 5;
    if (duration < 5 || duration > 15) {
      return NextResponse.json(
        { error: "Duration must be between 5 and 15 seconds" },
        { status: 400 },
      );
    }

    // Ensure AI Gateway key is set
    const apiKey =
      process.env.VERCEL_AI_GATEWAY_API_KEY ??
      process.env.AI_GATEWAY_API_KEY ??
      process.env.AI_GATEWAY_TOKEN;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI Gateway key not configured" },
        { status: 500 },
      );
    }
    if (!process.env.AI_GATEWAY_API_KEY) {
      process.env.AI_GATEWAY_API_KEY = apiKey;
    }

    // Fetch gateway metadata to determine if this is a language or video model
    const gatewayModels = await fetchAiGatewayModels().catch((err) => {
      console.error("[canvas/generate-video] Gateway models fetch failed:", err);
      return [];
    });
    const modelInfo = gatewayModels.find(m => m.id === modelId);

    // Only route to native generateVideo if it's NOT a language model
    if (modelInfo?.type === "language") {
      throw new Error(`Model ${modelId} is a language model and requires a tool-based video generation path (not yet implemented). Please use a native video model.`);
    }

    // Build provider options depending on model provider
    const providerOptions: Record<string, Record<string, string | number | boolean>> = {};

    if (modelId.startsWith("klingai/")) {
      providerOptions.klingai = {
        mode: body.quality === "pro" ? "pro" : "std",
        sound: body.audio ? "on" : "off",
      };
    } else if (modelId.startsWith("google/")) {
      providerOptions.vertex = {
        generateAudio: body.audio ?? false,
      };
    } else if (modelId.startsWith("bytedance/")) {
      providerOptions.bytedance = {
        enableAudio: body.audio ?? false,
      };
    }

    const result = await generateVideo({
      model: gateway.videoModel(modelId),
      prompt: body.prompt,
      aspectRatio: (body.aspectRatio || "16:9") as `${number}:${number}`,
      duration,
      providerOptions,
    });

    if (!result.videos || result.videos.length === 0) {
      return NextResponse.json(
        { error: "No video generated" },
        { status: 500 },
      );
    }

    const videoData = result.videos[0];
    const buffer = Buffer.from(videoData.uint8Array);
    const filename = `canvas/vid_${Date.now()}_${userId.slice(-6)}.mp4`;

    const blob = await put(filename, buffer, {
      access: "public",
      contentType: "video/mp4",
    });

    return NextResponse.json({
      mediaUrl: blob.url,
      pathname: blob.pathname,
      mediaType: "video",
      modelId,
      duration,
    });
  } catch (error) {
    console.error("[canvas/generate-video] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate video",
      },
      { status: 500 },
    );
  }
}
