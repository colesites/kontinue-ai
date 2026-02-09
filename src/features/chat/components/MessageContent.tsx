import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
import CodeBlock from "./CodeBlock";
import { PillLink } from "./PillLink";

interface MessageContentProps {
  content: string;
  isStreaming?: boolean;
}

export const MessageContent = memo(function MessageContent({
  content,
  isStreaming,
}: MessageContentProps) {
  return (
    <>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom code block rendering with copy button
          pre: ({ children }) => {
            // children is the <code> element
            return <>{children}</>;
          },
          code: ({ className, children, ...props }) => {
            // Check if this is a code block (has language class) or inline code
            const isCodeBlock =
              className?.includes("language-") || className?.includes("hljs");

            // If it has a language, definitely a code block
            if (isCodeBlock) {
              return <CodeBlock className={className}>{children}</CodeBlock>;
            }

            // If no language, check if content has newlines - if so, treat as block
            const contentString = String(children);
            if (contentString.includes("\n")) {
              return (
                <CodeBlock className="language-text">{children}</CodeBlock>
              );
            }

            // Inline code
            return (
              <code
                className="bg-muted/70 px-1.5 py-0.5 rounded text-[0.925em] text-primary font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Custom link as pill
          a: ({ href, children }) => (
            <PillLink href={href}>{children}</PillLink>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />
      )}
    </>
  );
});
