import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getMessages = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user || chat.ownerId !== user._id) {
      return [];
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_chat_order", (q) => q.eq("chatId", args.chatId))
      .collect();
  },
});

export const addMessage = mutation({
  args: {
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user || chat.ownerId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Rate limiting (requests only): apply to user messages
    if (args.role === "user") {
      const isPro = user.plan === "pro";
      const RPM_LIMIT = isPro ? 10 : 5;
      const RPD_LIMIT = isPro ? 100 : 20;

      const nowMs = Date.now();
      const minuteBucketStartMs = Math.floor(nowMs / 60_000) * 60_000;
      const dayBucketStartMs = Math.floor(nowMs / 86_400_000) * 86_400_000;

      const [minuteUsage, dayUsage] = await Promise.all([
        ctx.db
          .query("usage")
          .withIndex("by_owner_bucket", (q) =>
            q
              .eq("ownerId", user._id)
              .eq("bucketType", "minute")
              .eq("bucketStartMs", minuteBucketStartMs),
          )
          .unique(),
        ctx.db
          .query("usage")
          .withIndex("by_owner_bucket", (q) =>
            q
              .eq("ownerId", user._id)
              .eq("bucketType", "day")
              .eq("bucketStartMs", dayBucketStartMs),
          )
          .unique(),
      ]);

      const minuteCount = minuteUsage?.requestCount ?? 0;
      const dayCount = dayUsage?.requestCount ?? 0;

      if (minuteCount >= RPM_LIMIT) {
        throw new ConvexError({
          code: "RATE_LIMIT_RPM",
          message: `Rate limit reached (${RPM_LIMIT} requests/min). Please wait and try again.`,
        });
      }

      if (dayCount >= RPD_LIMIT) {
        throw new ConvexError({
          code: "RATE_LIMIT_RPD",
          message: `Daily limit reached (${RPD_LIMIT} requests/day). Please try again tomorrow or upgrade to Pro.`,
        });
      }

      // Increment usage (best-effort, non-transactional)
      if (minuteUsage) {
        await ctx.db.patch(minuteUsage._id, {
          requestCount: minuteCount + 1,
          updatedAt: nowMs,
        });
      } else {
        await ctx.db.insert("usage", {
          ownerId: user._id,
          bucketType: "minute",
          bucketStartMs: minuteBucketStartMs,
          requestCount: 1,
          updatedAt: nowMs,
        });
      }

      if (dayUsage) {
        await ctx.db.patch(dayUsage._id, {
          requestCount: dayCount + 1,
          updatedAt: nowMs,
        });
      } else {
        await ctx.db.insert("usage", {
          ownerId: user._id,
          bucketType: "day",
          bucketStartMs: dayBucketStartMs,
          requestCount: 1,
          updatedAt: nowMs,
        });
      }
    }

    // Get the highest order number
    const lastMessage = await ctx.db
      .query("messages")
      .withIndex("by_chat_order", (q) => q.eq("chatId", args.chatId))
      .order("desc")
      .first();

    const order = lastMessage ? lastMessage.order + 1 : 0;
    const now = Date.now();

    if (args.role === "user" && order === 0 && chat.title === "New Conversation") {
      const normalized = args.content
        .replace(/\s+/g, " ")
        .replace(/[`*_#>\[\]()/\\]/g, "")
        .trim();

      const base = (normalized.split(/[.!?]/)[0] ?? "").trim() || normalized;
      const STOP_WORDS = new Set([
        "the",
        "a",
        "an",
        "to",
        "for",
        "of",
        "and",
        "or",
        "in",
        "on",
        "with",
        "about",
        "please",
        "help",
        "me",
        "i",
        "im",
        "i'm",
        "can",
        "could",
        "would",
        "should",
        "do",
        "does",
        "is",
        "are",
        "my",
        "we",
        "you",
      ]);

      const words = base
        .split(/\s+/)
        .map((w) => w.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ""))
        .filter(Boolean);

      const filteredWords = words.filter((w) => !STOP_WORDS.has(w.toLowerCase()));
      const chosen = (filteredWords.length > 0 ? filteredWords : words).slice(0, 7);
      const candidate = chosen.join(" ");
      const maxChars = 32;
      const title = candidate.length > maxChars
        ? `${candidate.slice(0, maxChars).trimEnd()}…`
        : candidate || "New Conversation";

      await ctx.db.patch(args.chatId, {
        title,
        updatedAt: now,
      });
      chat.title = title;
    }

    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      ownerId: user._id,
      role: args.role,
      content: args.content,
      createdAt: now,
      order,
      metadata: {
        model: args.model,
        isImported: false,
      },
    });

    // Update chat's updatedAt
    await ctx.db.patch(args.chatId, {
      updatedAt: now,
    });

    return messageId;
  },
});

export const updateMessageContent = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    const chat = await ctx.db.get(message.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user || chat.ownerId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.messageId, {
      content: args.content,
    });
  },
});

