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
      className={`post-card animate-in animate-in--delay-${Math.min(index + 1, 3)}`}
    >
      <div className="post-card__header">
        <span className="post-card__date">{formattedDate}</span>
        {post.repo && <span className="post-card__repo">{post.repo}</span>}
      </div>
      <h2 className="post-card__title">{post.title}</h2>
      <p className="post-card__summary">{post.summary}</p>
      {post.tags.length > 0 && (
        <div className="post-card__tags">
          {post.tags.map((tag) => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
