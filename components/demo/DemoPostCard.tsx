"use client";

import { Link } from "@/i18n/routing";
import { DemoPost } from "@/lib/types";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";

interface DemoPostCardProps {
  post: DemoPost;
  index: number;
}

export default function DemoPostCard({ post, index }: DemoPostCardProps) {
  const locale = useLocale();
  const t = useTranslations("PostCard");

  const dateObj = new Date(post.date || new Date());
  const dateLocale = locale === "ko" ? ko : enUS;
  const dateFormat = locale === "ko" ? "yyyy.MM.dd" : "MMM d, yyyy";

  const formattedDate = format(dateObj, dateFormat, { locale: dateLocale });

  const finalHref = `/demo/${post.slug}`;

  const displayTags = post.tags || [];

  return (
    <Link
      href={finalHref}
      className="flex flex-col h-full border border-border-subtle rounded-2xl p-6 bg-surface/50 hover:bg-surface hover:border-border-strong hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 group animate-fade-in-up cursor-pointer relative overflow-hidden"
      style={{ animationDelay: `${Math.min(index * 0.08, 0.3)}s` }}
    >
      <div className="flex items-center justify-between mb-5 text-[11px] font-medium tracking-tight">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-text-tertiary uppercase tracking-widest">{t("demoSample")}</span>
        </div>
        <span className="text-text-tertiary">{formattedDate}</span>
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
            <span
              key={tag}
              className="text-xs text-text-tertiary bg-surface-subtle px-1.5 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
