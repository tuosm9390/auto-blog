"use client";

import dynamic from "next/dynamic";
import "highlight.js/styles/github-dark.css";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";

function normalizeContent(content: string): string {
  let normalized = content;
  normalized = normalized.replace(/(\S)\n(```)/g, "$1\n\n$2");
  normalized = normalized.replace(/(```)\n(\S)/g, "$1\n\n$2");
  return normalized;
}

interface DemoPostContentProps {
  content: string;
}

export default function DemoPostContent({ content }: DemoPostContentProps) {
  const normalizedContent = normalizeContent(content);

  return (
    <div className="markdown-content demo-mode">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeSanitize]}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
