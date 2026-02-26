import Link from "next/link";
import { Post } from "@/lib/types";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface PostCardProps {
  post: Post;
  index: number;
  href?: string;
}

export default function PostCard({ post, index, href }: PostCardProps) {
  const dateObj = new Date(post.date || new Date());
  const formattedDate = format(dateObj, "yyyy.MM.dd", { locale: ko });
  const formattedTime = format(dateObj, "HH:mm", { locale: ko });

  const finalHref = href || `/posts/${post.id}`;
  
  // 저장소 이름에서 유저명 부분 제거 (예: owner/repo -> repo)
  const displayRepo = post.repo ? post.repo.split("/").pop() : null;

  // 자동 포스팅 태그 확인
  const isAutoPost = post.tags?.includes("자동 포스팅");
  // UI에 표시할 일반 태그 (자동 포스팅 제외)
  const displayTags = post.tags?.filter(t => t !== "자동 포스팅") || [];

  return (
    <Link
      href={finalHref}
      className="flex flex-col h-full border border-border-subtle rounded-2xl p-6 bg-surface/50 hover:bg-surface hover:border-border-strong hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 group animate-fade-in-up cursor-pointer relative overflow-hidden"
      style={{ animationDelay: `${Math.min(index * 0.08, 0.3)}s` }}
    >
      {isAutoPost && (
        <div className="absolute top-0 right-0 bg-accent/20 text-accent text-[10px] font-bold px-3 py-1 rounded-bl-lg border-b border-l border-accent/30">
          🤖 자동 포스팅
        </div>
      )}
      <div className="flex items-start justify-between mb-5 text-[11px] font-medium tracking-tight">
        <div className="flex flex-col gap-0.5 mt-1">
          <span className="text-accent font-bold">@{post.author || "unknown"}</span>
          <span className="text-text-tertiary">{formattedDate} {formattedTime}</span>
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
