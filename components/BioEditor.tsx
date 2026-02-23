"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function BioEditor({ initialBio, username }: { initialBio: string, username: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(initialBio);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles/${username}/bio`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio })
      });
      if (!res.ok) throw new Error("Failed to update bio");
      toast.success("소개글이 성공적으로 업데이트되었습니다.");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      toast.error("소개글 업데이트 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="relative group/bio cursor-text" onClick={() => setIsEditing(true)}>
        <p className="text-text-secondary max-w-2xl leading-relaxed whitespace-pre-wrap">
          {bio || "작성자 소개글이 없습니다. 클릭하여 소개글을 등록해 보세요."}
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
          className="absolute -right-8 top-0 p-1 opacity-0 group-hover/bio:opacity-100 transition-opacity text-text-tertiary hover:text-accent"
          aria-label="소개글 수정"
        >
          ✏️
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mt-1">
      <textarea
        value={bio}
        onChange={e => setBio(e.target.value)}
        className="w-full bg-surface border border-border-strong rounded-lg p-3 text-sm focus:outline-none focus:border-accent min-h-[80px]"
        placeholder="자신을 소개하는 글을 작성해보세요..."
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={() => { setBio(initialBio); setIsEditing(false); }}
          className="px-4 py-1.5 text-xs text-text-secondary hover:bg-surface border border-border-subtle rounded-md transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-1.5 text-xs bg-accent text-black font-semibold rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {loading ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}
