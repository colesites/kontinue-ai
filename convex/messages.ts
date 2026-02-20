import { ConvexError, v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

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
    isPremiumModel: v.optional(v.boolean()),
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

      const nowMs = Date.now();
      const minuteBucketStartMs = Math.floor(nowMs / 60_000) * 60_000;
      // Monthly bucket start: first ms of current UTC calendar month
      const d = new Date(nowMs);
      const monthBucketStartMs = Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        1,
      );

      // ── Free users: single monthly quota (20/month) ─────────────────────────
      // ── Pro users: two monthly quotas split by model tier ────────────────────
      //     30 messages on premium models + 270 on standard models = 300 total
      const premiumBucketType = "month_premium" as const;
      const standardBucketType = "month_standard" as const;
      const FREE_MONTHLY_LIMIT = 20;
      const PRO_PREMIUM_LIMIT = 30;
      const PRO_STANDARD_LIMIT = 270;

      if (isPro) {
        const isModelPremium = args.isPremiumModel ?? false;
        const activeBucketType = isModelPremium
          ? premiumBucketType
          : standardBucketType;
        const activeLimit = isModelPremium
          ? PRO_PREMIUM_LIMIT
          : PRO_STANDARD_LIMIT;

        const [minuteUsage, periodicUsage] = await Promise.all([
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
                .eq("bucketType", activeBucketType)
                .eq("bucketStartMs", monthBucketStartMs),
            )
            .unique(),
        ]);

        const minuteCount = minuteUsage?.requestCount ?? 0;
        const periodicCount = periodicUsage?.requestCount ?? 0;

        if (minuteCount >= RPM_LIMIT) {
          throw new ConvexError({
            code: "RATE_LIMIT_RPM",
            message: `Rate limit reached (${RPM_LIMIT} requests/min). Please wait and try again.`,
          });
        }
        if (periodicCount >= activeLimit) {
          throw new ConvexError({
            code: isModelPremium
              ? "RATE_LIMIT_PRO_PREMIUM"
              : "RATE_LIMIT_PRO_STANDARD",
            message: isModelPremium
              ? `Monthly premium-model limit reached (${PRO_PREMIUM_LIMIT} messages/month on premium models). Switch to a standard model or try again next month.`
              : `Monthly standard-model limit reached (${PRO_STANDARD_LIMIT} messages/month on standard models). Try again next month.`,
          });
        }

        // Increment usage
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
        if (periodicUsage) {
          await ctx.db.patch(periodicUsage._id, {
            requestCount: periodicCount + 1,
            updatedAt: nowMs,
          });
        } else {
          await ctx.db.insert("usage", {
            ownerId: user._id,
            bucketType: activeBucketType,
            bucketStartMs: monthBucketStartMs,
            requestCount: 1,
            updatedAt: nowMs,
          });
        }
      } else {
        // ── Free users ───────────────────────────────────────────────────────────
        const [minuteUsage, monthUsage] = await Promise.all([
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
                .eq("bucketType", "month")
                .eq("bucketStartMs", monthBucketStartMs),
            )
            .unique(),
        ]);

        const minuteCount = minuteUsage?.requestCount ?? 0;
        const monthCount = monthUsage?.requestCount ?? 0;

        if (minuteCount >= RPM_LIMIT) {
          throw new ConvexError({
            code: "RATE_LIMIT_RPM",
            message: `Rate limit reached (${RPM_LIMIT} requests/min). Please wait and try again.`,
          });
        }
        if (monthCount >= FREE_MONTHLY_LIMIT) {
          throw new ConvexError({
            code: "RATE_LIMIT_MONTHLY",
            message: `Monthly message limit reached (${FREE_MONTHLY_LIMIT} messages/month). Please try again next month or upgrade to Pro.`,
          });
        }

        // Increment usage
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
        if (monthUsage) {
          await ctx.db.patch(monthUsage._id, {
            requestCount: monthCount + 1,
            updatedAt: nowMs,
          });
        } else {
          await ctx.db.insert("usage", {
            ownerId: user._id,
            bucketType: "month",
            bucketStartMs: monthBucketStartMs,
            requestCount: 1,
            updatedAt: nowMs,
          });
        }
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

    if (
      args.role === "user" &&
      order === 0 &&
      chat.title === "New Conversation"
    ) {
      // Schedule title generation as a background action
      await ctx.scheduler.runAfter(
        0,
        internal.titleGenerator.generateAndUpdateTitle,
        {
          chatId: args.chatId,
          firstMessage: args.content,
        },
      );
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

// Internal mutation to update chat title (bypasses auth checks)
export const updateChatTitleInternal = internalMutation({
  args: {
    chatId: v.id("chats"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.chatId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

/** Returns the current-month usage counts for the logged-in user.
 *  Used by the Settings page to render the usage tracker. */
export const getMonthlyUsage = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user) return null;

    const d = new Date();
    const monthBucketStartMs = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);

    const [freeMonthly, proPremium, proStandard] = await Promise.all([
      ctx.db
        .query("usage")
        .withIndex("by_owner_bucket", (q) =>
          q.eq("ownerId", user._id).eq("bucketType", "month").eq("bucketStartMs", monthBucketStartMs),
        )
        .unique(),
      ctx.db
        .query("usage")
        .withIndex("by_owner_bucket", (q) =>
          q.eq("ownerId", user._id).eq("bucketType", "month_premium").eq("bucketStartMs", monthBucketStartMs),
        )
        .unique(),
      ctx.db
        .query("usage")
        .withIndex("by_owner_bucket", (q) =>
          q.eq("ownerId", user._id).eq("bucketType", "month_standard").eq("bucketStartMs", monthBucketStartMs),
        )
        .unique(),
    ]);

    return {
      isPro: user.plan === "pro",
      // Free tier
      freeMonthlyUsed: freeMonthly?.requestCount ?? 0,
      freeMonthlyLimit: 20,
      // Pro tier (split)
      proPremiumUsed: proPremium?.requestCount ?? 0,
      proPremiumLimit: 30,
      proStandardUsed: proStandard?.requestCount ?? 0,
      proStandardLimit: 270,
    };
  },
});

