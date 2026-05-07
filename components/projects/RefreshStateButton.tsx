"use client";

import { useFormStatus } from "react-dom";

export function RefreshStateButton({
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
      aria-busy={pending}
      className="w-full min-h-12 px-5 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors disabled:cursor-wait disabled:opacity-70"
    >
      <span className="inline-flex items-center justify-center gap-2">
        {pending ? (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
        ) : null}
        {pending ? pendingLabel : idleLabel}
      </span>
    </button>
  );
}
