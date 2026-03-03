"use client";

import dynamic from "next/dynamic";
import "highlight.js/styles/github-dark.css";

// react-markdown을 dynamic import하여 초기 번들에서 분리
const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";

// highlight.js — 자주 사용되는 언어만 선택적 import (번들 크기 대폭 축소)
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import sql from "highlight.js/lib/languages/sql";
import diff from "highlight.js/lib/languages/diff";
import yaml from "highlight.js/lib/languages/yaml";
import markdown from "highlight.js/lib/languages/markdown";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("tsx", typescript);
hljs.registerLanguage("jsx", javascript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("css", css);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("diff", diff);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("yml", yaml);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("md", markdown);

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
        rehypePlugins={[rehypeHighlight, rehypeSanitize]}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
