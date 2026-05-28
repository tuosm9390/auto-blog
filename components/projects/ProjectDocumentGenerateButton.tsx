"use client";
// Evidence 문서 AI 초안 작성 버튼의 pending 상태를 표시한다.
import { useFormStatus } from "react-dom";

export default function ProjectDocumentGenerateButton({
  idleLabel,
  pendingLabel,
}: {
  idleLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-accent text-black rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
