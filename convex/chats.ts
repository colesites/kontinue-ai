import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createChat = mutation({
  args: {
    title: v.string(),
    provider: v.string(),
    sourceUrl: v.optional(v.string()),
    importMethod: v.union(v.literal("automatic"), v.literal("manual")),
    messages: v.array(
      v.object({
        role: v.union(v.literal("system"), v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Feature gating: Limit free users to 10 chats
    if (user.plan !== "pro") {
      const chatCount = await ctx.db
        .query("chats")
        .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
        .collect();

      if (chatCount.length >= 10) {
        throw new Error(
          "Free tier limit reached (10 chats). Please upgrade to Pro to continue importing.",
        );
      }
    }

    const now = Date.now();

    const chatId = await ctx.db.insert("chats", {
      ownerId: user._id,
      title: args.title,
      createdAt: now,
      updatedAt: now,
      source: {
        provider: args.provider,
        sourceUrl: args.sourceUrl,
        importedAt: now,
        importMethod: args.importMethod,
      },
    });

    // Insert imported messages
    for (let i = 0; i < args.messages.length; i++) {
      const msg = args.messages[i];
      await ctx.db.insert("messages", {
        chatId,
        ownerId: user._id,
        role: msg.role,
        content: msg.content,
        createdAt: now,
        order: i,
        metadata: {
          isImported: true,
        },
      });
    }

    return chatId;
  }
});

export const getChat = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user || chat.ownerId !== user._id) {
      return null;
    }

    return chat;
  },
});

export const getUserChats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("chats")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .collect();
  },
});

export const updateChatTitle = mutation({
  args: {
    chatId: v.id("chats"),
    title: v.string(),
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

    await ctx.db.patch(args.chatId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

export const deleteChat = mutation({
  args: { chatId: v.id("chats") },
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

    // Delete all messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    // Delete the chat
    await ctx.db.delete(args.chatId);
  },
});

export const searchChats = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    // 1. Clean and validate query
    const STOP_WORDS = new Set([
      "the",
      "and",
      "a",
      "an",
      "to",
      "for",
      "with",
      "is",
      "in",
      "on",
      "at",
      "by",
      "this",
      "that",
      "it",
      "from",
      "are",
      "was",
      "were",
      "be",
      "has",
      "have",
      "had",
      "can",
      "will",
      "would",
      "should",
      "not",
    ]);

    const searchQuery = args.query.trim().replace(/[.,!?;:]/g, "");
    if (!searchQuery) return [];

    // Extract significant words for post-filtering
    const searchWords = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    // If no significant words, use original query as-is
    const finalSearchQuery =
      searchWords.length > 0 ? searchWords.join(" ") : searchQuery;

    // Helper: Count how many search words appear in text
    const countMatchingWords = (text: string, words: string[]): number => {
      const lowerText = text.toLowerCase();
      return words.filter((word) => lowerText.includes(word)).length;
    };

    // Helper: Check if text contains exact phrase (case-insensitive)
    const containsExactPhrase = (text: string, phrase: string): boolean => {
      return text.toLowerCase().includes(phrase.toLowerCase());
    };

    // 2. Parallel Search for Titles and Messages
    const [titleMatches, userMatches, assistantMatches] = await Promise.all([
      ctx.db
        .query("chats")
        .withSearchIndex("search_title", (q) =>
          q.search("title", finalSearchQuery).eq("ownerId", user._id),
        )
        .take(20),
      ctx.db
        .query("messages")
        .withSearchIndex("search_content", (q) =>
          q
            .search("content", finalSearchQuery)
            .eq("ownerId", user._id)
            .eq("role", "user"),
        )
        .take(30),
      ctx.db
        .query("messages")
        .withSearchIndex("search_content", (q) =>
          q
            .search("content", finalSearchQuery)
            .eq("ownerId", user._id)
            .eq("role", "assistant"),
        )
        .take(30),
    ]);

    // 3. Build chat data with content for post-filtering
    const chatData = new Map<
      string,
      { chat: any; score: number; matchedContent: string[] }
    >();

    // Process title matches - require at least 50% of search words match
    const minRequiredWords = Math.max(1, Math.ceil(searchWords.length * 0.5));

    titleMatches.forEach((chat, index) => {
      if (!chat) return;
      const matchCount = countMatchingWords(chat.title, searchWords);

      // Skip if not enough words match
      if (searchWords.length > 0 && matchCount < minRequiredWords) return;

      // Base score from position + bonus for word matches
      let score = 100 - index * 3;
      score += matchCount * 10; // Bonus per matching word

      // Big bonus for exact phrase match
      if (containsExactPhrase(chat.title, searchQuery)) {
        score += 50;
      }

      chatData.set(chat._id, {
        chat,
        score,
        matchedContent: [chat.title],
      });
    });

    // Process message matches
    const allMessageMatches = [...userMatches, ...assistantMatches];

    for (const msg of allMessageMatches) {
      if (!msg || !msg.chatId) continue;

      const matchCount = countMatchingWords(msg.content, searchWords);

      // Skip if not enough words match
      if (searchWords.length > 0 && matchCount < minRequiredWords) continue;

      // Calculate score
      let score = 50; // Base score for message matches
      score += matchCount * 8; // Bonus per matching word

      // Big bonus for exact phrase match
      if (containsExactPhrase(msg.content, searchQuery)) {
        score += 40;
      }

      const existing = chatData.get(msg.chatId);
      if (existing) {
        // Add to matched content and maybe improve score
        existing.matchedContent.push(msg.content.slice(0, 200));
        if (score > existing.score) {
          existing.score = score;
        }
      } else {
        // Need to fetch the chat
        chatData.set(msg.chatId, {
          chat: null, // Will fetch later
          score,
          matchedContent: [msg.content.slice(0, 200)],
        });
      }
    }

    // 4. Fetch missing chat objects
    const chatIdsToFetch = Array.from(chatData.entries())
      .filter(([_, data]) => data.chat === null)
      .map(([id]) => id);

    const fetchedChats = await Promise.all(
      chatIdsToFetch.map((id) => {
        try {
          return ctx.db.get(id as any);
        } catch {
          return null;
        }
      }),
    );

    // Update chatData with fetched chats
    chatIdsToFetch.forEach((id, index) => {
      const fetched = fetchedChats[index];
      const data = chatData.get(id);
      if (data && fetched) {
        data.chat = fetched;
      } else if (data && !fetched) {
        chatData.delete(id); // Remove if chat not found
      }
    });

    // 5. Final sort and return
    const finalResults = Array.from(chatData.values())
      .filter((data) => data.chat !== null)
      .sort((a, b) => b.score - a.score)
      .map((data) => data.chat);

    return finalResults.slice(0, 10);
  },
});

export const backfillMessageOwners = mutation({
  args: {},
  handler: async (ctx) => {
    const chats = await ctx.db.query("chats").collect();
    let count = 0;

    for (const chat of chats) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
        .collect();

      for (const msg of messages) {
        if (!msg.ownerId) {
          await ctx.db.patch(msg._id, { ownerId: chat.ownerId });
          count++;
        }
      }
    }
    return count;
  },
});
