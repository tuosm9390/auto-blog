"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Post } from "@/lib/types";

export default function EditForm({ post }: { post: Post }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: post.title,
    content: post.content,
    summary: post.summary,
    tags: post.tags.join(", "),
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          repo: post.repo,
          commits: post.commits,
          tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error("수정 실패");

      alert("수정되었습니다.");
      router.push(`/posts/${post.id}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-in">
      <div className="form-group">
        <label htmlFor="title" className="form-label">
          제목
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="summary" className="form-label">
          요약
        </label>
        <input
          type="text"
          id="summary"
          name="summary"
          value={formData.summary}
          onChange={handleChange}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="tags" className="form-label">
          태그 (쉼표로 구분)
        </label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="content" className="form-label">
          내용 (Markdown)
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          className="form-input"
          rows={15}
          required
          style={{ fontFamily: "var(--font-mono)", fontSize: "14px" }}
        />
      </div>

      <div className="btn-group">
        <button
          type="submit"
          disabled={loading}
          className="btn btn--primary"
        >
          {loading ? "저장 중..." : "저장하기"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn--secondary"
        >
          취소
        </button>
      </div>
    </form>
  );
}
