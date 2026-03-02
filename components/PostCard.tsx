"use client";

import { Link } from "@/i18n/routing";
import { Post } from "@/lib/types";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";

interface PostCardProps {
  post: Post;
  index: number;
  href?: string;
}

export default function PostCard({ post, index, href }: PostCardProps) {
  const locale = useLocale();
  const t = useTranslations("PostCard");
  
  const dateObj = new Date(post.date || new Date());
  const dateLocale = locale === 'ko' ? ko : enUS;
  const dateFormat = locale === 'ko' ? "yyyy.MM.dd HH:mm" : "MMM d, yyyy HH:mm";
  
  const formattedDate = format(dateObj, dateFormat, { locale: dateLocale });

  const finalHref = href || `/posts/${post.id}`;
  const displayRepo = post.repo ? post.repo.split("/").pop() : null;

  // 번역 키 확인용 태그 (영문/한글 공통)
  const isAutoPost = post.tags?.includes("자동 포스팅") || post.tags?.includes("auto-posted");
  const displayTags = post.tags?.filter(t => t !== "자동 포스팅" && t !== "auto-posted") || [];

  return (
    <Link
      href={finalHref}
      className="flex flex-col h-full border border-border-subtle rounded-2xl p-6 bg-surface/50 hover:bg-surface hover:border-border-strong hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 group animate-fade-in-up cursor-pointer relative overflow-hidden"
      style={{ animationDelay: `${Math.min(index * 0.08, 0.3)}s` }}
    >
      {isAutoPost && (
        <div className="absolute top-0 right-0 bg-accent/20 text-accent text-[10px] font-bold px-3 py-1 rounded-bl-lg border-b border-l border-accent/30">
          {t("autoPost")}
        </div>
      )}
      <div className="flex items-start justify-between mb-5 text-[11px] font-medium tracking-tight">
        <div className="flex flex-col gap-0.5 mt-1">
          <span className="text-accent font-bold">@{post.author || t("unknown")}</span>
          <span className="text-text-tertiary">{formattedDate}</span>
        </div>
        {displayRepo && (
          <span className={`px-2 py-0.5 bg-surface-subtle border border-border-subtle rounded text-text-tertiary font-semibold ${isAutoPost ? "mr-16" : ""}`}>
            {displayRepo}
          </span>
        )}
      </div>
      
      <div className="flex-1">
        <h2 className="text-xl font-bold mb-3 text-text-primary group-hover:text-accent transition-colors line-clamp-2 leading-tight">
          {post.title}
        </h2>
        {post.summary && (
          <p className="text-sm text-text-secondary line-clamp-3 mb-4 leading-relaxed">
            {post.summary}
          </p>
        )}
      </div>

      {displayTags.length > 0 && (
        <div className="flex gap-2 flex-wrap mt-auto pt-4 border-t border-border-subtle/50">
          {displayTags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs text-text-tertiary bg-surface-subtle px-1.5 py-0.5 rounded">
              #{tag}
            </span>
          ))}
          {displayTags.length > 3 && (
            <span className="text-xs text-text-tertiary/60 py-0.5">
              +{displayTags.length - 3}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
