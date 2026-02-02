import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()), // 'active', 'canceled'
    plan: v.optional(v.string()), // 'free', 'pro'
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkUserId"])
    .index("by_email", ["email"]),

  chats: defineTable({
    ownerId: v.id("users"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    source: v.object({
      provider: v.string(),
      sourceUrl: v.optional(v.string()),
      importedAt: v.number(),
      importMethod: v.union(v.literal("automatic"), v.literal("manual")),
    }),
  })
    .index("by_owner", ["ownerId"])
    .index("by_updated", ["updatedAt"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["ownerId"],
    }),

  messages: defineTable({
    chatId: v.id("chats"),
    ownerId: v.optional(v.id("users")),
    role: v.union(
      v.literal("system"),
      v.literal("user"),
      v.literal("assistant"),
    ),
    content: v.string(),
    createdAt: v.number(),
    order: v.number(),
    metadata: v.optional(
      v.object({
        model: v.optional(v.string()),
        tokenCount: v.optional(v.number()),
        isImported: v.optional(v.boolean()),
      }),
    ),
  })
    .index("by_chat", ["chatId"])
    .index("by_chat_order", ["chatId", "order"])
    .index("by_owner", ["ownerId"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["ownerId", "role"],
    }),

  imports: defineTable({
    ownerId: v.id("users"),
    provider: v.string(),
    sourceUrl: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("success"),
      v.literal("failed"),
    ),
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    messageCount: v.optional(v.number()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"]),

  userSettings: defineTable({
    ownerId: v.id("users"),
    defaultModel: v.string(),
    uiPrefs: v.optional(
      v.object({
        theme: v.optional(v.string()),
        compactMode: v.optional(v.boolean()),
      }),
    ),
  }).index("by_owner", ["ownerId"]),
});

