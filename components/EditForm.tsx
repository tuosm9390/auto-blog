"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Post } from "@/lib/types";
import { toast } from "sonner";

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

      toast.success("🎉 포스트가 성공적으로 수정되었습니다!");
      router.push(`/posts/${post.id}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("❌ 수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          제목
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-border-strong transition-colors"
          required
        />
      </div>

      <div>
        <label htmlFor="summary" className="block text-sm font-medium mb-2">
          요약
        </label>
        <input
          type="text"
          id="summary"
          name="summary"
          value={formData.summary}
          onChange={handleChange}
          className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-border-strong transition-colors"
        />
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium mb-2">
          태그 (쉼표로 구분)
        </label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-border-strong transition-colors"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-2">
          내용 (Markdown)
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-border-strong transition-colors min-h-[400px]"
          rows={15}
          required
          style={{ fontFamily: "var(--font-mono)" }}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong transition-colors cursor-pointer"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </form>
  );
}
