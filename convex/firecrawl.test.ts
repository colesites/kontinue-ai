
import { describe, expect, test } from "bun:test";
import { parseGeminiFromMarkdown } from "./firecrawl";

const SAMPLE_INPUT = `[Sign in](https://accounts.google.com/ServiceLogin?passive=1209600&continue=https://gemini.google.com/share/ccad17bb0b9c&followup=https://gemini.google.com/share/ccad17bb0b9c&ec=GAZAkgU)

[Gemini](https://gemini.google.com/app)

[About Gemini Opens in a new window](https://gemini.google/about/?utm_source=gemini&utm_medium=web&utm_campaign=gemini_zero_state_link_to_marketing_microsite) [Gemini App Opens in a new window](https://gemini.google.com/app/download) [Subscriptions Opens in a new window](https://one.google.com/ai) [For Business Opens in a new window](https://workspace.google.com/solutions/ai/?utm_source=geminiforbusiness&utm_medium=et&utm_campaign=gemini-page-crosslink&utm_term=-&utm_content=forbusiness-2025Q3)

# **Testing and Capabilities Offered**

[https://gemini.google.com/share/ccad17bb0b9c](https://gemini.google.com/share/ccad17bb0b9c)

Created with **Fast** January 31, 2026 at 03:04 AM Published January 31, 2026 at 03:04 AM

testing

Loud and clear! I'm up and running.

How can I help you today? I can assist with things like:

- **Brainstorming** ideas for a project.

- **Drafting or editing** emails and documents.

- **Generating images or videos** based on your descriptions.

- **Explaining** complex topics or solving problems.


Would you like me to try generating a creative image for you to start things off?

[Google Privacy Policy  Opens in a new window](https://policies.google.com/privacy) [Google Terms of Service  Opens in a new window](https://policies.google.com/terms) [Your privacy & Gemini Apps  Opens in a new window](https://support.google.com/gemini?p=privacy_notice)

Gemini may display inaccurate info, including about people, so double-check its responses.

Sign in

Copy public link

Report`;

describe("Gemini Parser", () => {
  test("correctly parses sample input", () => {
    const result = parseGeminiFromMarkdown(SAMPLE_INPUT);

    expect(result.title).toBe("Testing and Capabilities Offered");
    expect(result.messages).toHaveLength(4);

    expect(result.messages[0]).toEqual({
      role: "user",
      content: "testing",
    });

    expect(result.messages[1].role).toBe("assistant");
    expect(result.messages[1].content).toContain("Loud and clear!");

    expect(result.messages[2].role).toBe("assistant");
    expect(result.messages[2].content).toContain("How can I help you today?");
    expect(result.messages[2].content).toContain("- **Brainstorming** ideas");

    expect(result.messages[3]).toEqual({
      role: "assistant", // Logic from original test expected this to be assistant
      content: "Would you like me to try generating a creative image for you to start things off?",
    });
  });
});
