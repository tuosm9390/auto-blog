"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function BioEditor({ initialBio, username }: { initialBio: string, username: string }) {
  const t = useTranslations("BioEditor");
  const commonT = useTranslations("Common");
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
      toast.success(t("updateSuccess"));
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      toast.error(t("updateError"));
    } finally {
      setLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="relative group/bio cursor-text" onClick={() => setIsEditing(true)}>
        <p className="text-text-secondary max-w-2xl leading-relaxed whitespace-pre-wrap">
          {bio || t("empty")}
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
          className="absolute -right-8 top-0 p-1 opacity-0 group-hover/bio:opacity-100 transition-opacity text-text-tertiary hover:text-accent"
          aria-label={t("editAria")}
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
        placeholder={t("placeholder")}
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={() => { setBio(initialBio); setIsEditing(false); }}
          className="px-4 py-1.5 text-xs text-text-secondary hover:bg-surface border border-border-subtle rounded-md transition-colors"
        >
          {commonT("cancel")}
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-1.5 text-xs bg-accent text-black font-semibold rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {loading ? commonT("loading") : commonT("save")}
        </button>
      </div>
    </div>
  );
}
