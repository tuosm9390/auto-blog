"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

interface PostContentProps {
  content: string;
}

/**
 * 마크다운 content를 정규화하여 코드 블록 깨짐을 방지
 * - 코드 블록(```) 앞뒤에 빈 줄 보장 (마크다운 파서 요구사항)
 */
function normalizeContent(content: string): string {
  let normalized = content;

  // 코드 블록 시작(```) 앞에 빈 줄이 없으면 추가
  normalized = normalized.replace(/(\S)\n(```)/g, "$1\n\n$2");

  // 코드 블록 종료(```) 뒤에 빈 줄이 없으면 추가
  normalized = normalized.replace(/(```)\n(\S)/g, "$1\n\n$2");

  return normalized;
}

export default function PostContent({ content }: PostContentProps) {
  const normalizedContent = normalizeContent(content);

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
