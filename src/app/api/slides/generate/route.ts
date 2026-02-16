import { auth } from "@clerk/nextjs/server";
import { generateObject } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { NextResponse } from "next/server";
import { z } from "zod";
import { FREE_DEFAULT_MODEL_ID } from "@/lib/models";

const requestSchema = z.object({
  text: z.string().min(80, "Please provide more document content."),
  audience: z.string().optional(),
  tone: z.string().optional(),
  slideCount: z.number().int().min(4).max(20).optional(),
  language: z.string().optional(),
});

const slideSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  bullets: z.array(z.string()).min(2).max(6),
  visualIdea: z.string().optional(),
  speakerNotes: z.string().optional(),
  accent: z.enum(["insight", "data", "warning", "neutral"]).default("neutral"),
});

const deckSchema = z.object({
  deckTitle: z.string(),
  deckSubtitle: z.string().optional(),
  themeDirection: z.string(),
  slides: z.array(slideSchema).min(4).max(20),
});

const SYSTEM_PROMPT = `You are a world-class presentation designer.
Turn the source document into a clear, beautiful, high-signal slide deck.

Rules:
- Keep each slide focused on one key idea.
- Use concise bullets, not paragraphs.
- Include a clear narrative arc: context -> problem/opportunity -> analysis -> recommendations -> next steps.
- Include practical speaker notes when useful.
- Choose the right accent ("insight", "data", "warning", "neutral") for each slide.
- Do not hallucinate facts not present in the source text.
- Return output that strictly matches the schema.`;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsedBody = requestSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? "Invalid request body" },
        { status: 400 },
      );
    }

    const { text, audience, tone, slideCount, language } = parsedBody.data;

    const apiKey =
      process.env.VERCEL_AI_GATEWAY_API_KEY ??
      process.env.AI_GATEWAY_API_KEY ??
      process.env.AI_GATEWAY_TOKEN;

    if (!apiKey) {
      return NextResponse.json(
        { error: "AI is not configured. Missing gateway key." },
        { status: 500 },
      );
    }

    if (!process.env.AI_GATEWAY_API_KEY) {
      process.env.AI_GATEWAY_API_KEY = apiKey;
    }

    const userPrompt = [
      `Target slide count: ${slideCount ?? 8}`,
      `Audience: ${audience || "General business audience"}`,
      `Tone: ${tone || "Clear, confident, modern"}`,
      `Output language: ${language || "Match source language"}`,
      "",
      "Source document:",
      text.slice(0, 22000),
    ].join("\n");

    const { object } = await generateObject({
      model: gateway(FREE_DEFAULT_MODEL_ID),
      schema: deckSchema,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.4,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("[slides-generate] failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate slides",
      },
      { status: 500 },
    );
  }
}
