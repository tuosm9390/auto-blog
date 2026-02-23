"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ConfirmProvider";

export default function PostControls({ postId }: { postId: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: "포스트 삭제",
      description: "🚨 정말로 이 포스트를 영구적으로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.",
      confirmText: "삭제",
      destructive: true,
    });
    if (!isConfirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("삭제 실패");

      toast.success("🗑️ 포스트가 성공적으로 삭제되었습니다.");
      router.push("/posts");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("❌ 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-border-subtle flex gap-3">
      <Link href={`/posts/${postId}/edit`} className="px-5 py-2.5 border border-border-subtle rounded-lg text-sm font-medium text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors cursor-pointer">
        수정
      </Link>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="px-5 py-2.5 bg-error/10 border border-error/20 text-error rounded-lg text-sm font-medium hover:bg-error/20 hover:border-error/30 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {isDeleting ? "삭제 중..." : "삭제"}
      </button>
    </div>
  );
}
