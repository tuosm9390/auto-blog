import Link from "next/link";
import { Post } from "@/lib/types";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface PostCardProps {
  post: Post;
  index: number;
}

export default function PostCard({ post, index }: PostCardProps) {
  const formattedDate = post.date
    ? format(new Date(post.date), "yyyy년 M월 d일", { locale: ko })
    : "";

  return (
    <Link
      href={`/posts/${post.id}`}
      className="block border border-border-subtle rounded-xl p-6 hover:bg-surface hover:border-border-strong transition-all duration-300 group animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index * 0.08, 0.3)}s` }}
    >
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="text-text-tertiary">{formattedDate}</span>
        {post.repo && (
          <span className="px-2 py-0.5 border border-border-subtle rounded-full text-text-tertiary">
            {post.repo}
          </span>
        )}
      </div>
      <h2 className="text-lg font-semibold mb-2 text-text-primary group-hover:text-accent transition-colors line-clamp-2">
        {post.title}
      </h2>
      <p className="text-sm text-text-secondary mb-4 line-clamp-2">
        {post.summary}
      </p>
      {post.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs text-text-tertiary">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
