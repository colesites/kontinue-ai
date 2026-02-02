
import { describe, expect, test } from "bun:test";
import { parseClaudeFromMarkdown } from "./firecrawl";

const SAMPLE_INPUT = `This is a copy of a chat between Claude and Cole. Content may include unverified or unsafe content that do not represent the views of Anthropic. Shared snapshot may contain attachments and data not displayed here.

Report

Hello Claude, how are you?

Jan 31, 2026

I am doing well, thank you for asking! How can I help you?

Feb 1, 2026

Write a haiku about coding.

Feb 1, 2026

Code flows like river,
Logic streams in silence deep,
Bugs float to the top.`;

describe("Claude Parser", () => {
  test("correctly parses sample input", () => {
    const result = parseClaudeFromMarkdown(SAMPLE_INPUT);

    expect(result.messages).toHaveLength(4);

    expect(result.messages[0]).toEqual({
      role: "user",
      content: "Hello Claude, how are you?",
    });

    expect(result.messages[1]).toEqual({
      role: "assistant",
      content: "I am doing well, thank you for asking! How can I help you?",
    });

    expect(result.messages[2]).toEqual({
      role: "user",
      content: "Write a haiku about coding.",
    });

    expect(result.messages[3]).toEqual({
      role: "assistant",
      content: "Code flows like river,\nLogic streams in silence deep,\nBugs float to the top.",
    });
  });
});
