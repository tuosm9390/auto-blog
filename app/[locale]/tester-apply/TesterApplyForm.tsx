"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface TesterApplyFormProps {
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
  };
}

export default function TesterApplyForm({ user }: TesterApplyFormProps) {
  const t = useTranslations("TesterApply");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const interestsList = [
    { id: "web", label: t("intWeb") },
    { id: "app", label: t("intApp") },
    { id: "embedded", label: t("intEmbedded") },
    { id: "vibecoding", label: t("intVibe") },
    { id: "ai_ml", label: t("intAI") },
    { id: "deeplearning", label: t("intDeep") },
    { id: "cloud_devops", label: t("intCloud") },
    { id: "game", label: t("intGame") },
    { id: "security", label: t("intSecurity") },
  ];

  const handleInterestToggle = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email"),
      githubEmail: formData.get("githubEmail"),
      githubUsername: user.username,
      experience: formData.get("experience"),
      interests: selectedInterests,
      motivation: formData.get("motivation"),
    };

    try {
      const response = await fetch("/api/tester-apply", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/"), 3000);
      } else {
        alert(t("error"));
      }
    } catch (error) {
      console.error(error);
      alert(t("error"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">✅</span>
        </div>
        <h2 className="text-2xl font-bold mb-4">{t("success")}</h2>
        <p className="text-text-secondary">{t("desc")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 기본 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-primary">
            {t("githubUsername")}
          </label>
          <input
            type="text"
            value={user.username || user.name}
            readOnly
            className="w-full px-4 py-2.5 rounded-lg bg-elevated border border-border-subtle text-text-tertiary outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-primary">
            {t("githubEmail")}
          </label>
          <input
            type="email"
            name="githubEmail"
            defaultValue={user.email}
            required
            className="w-full px-4 py-2.5 rounded-lg bg-canvas border border-border-subtle focus:border-accent outline-none transition-colors"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-text-primary">
          {t("email")}
        </label>
        <input
          type="email"
          name="email"
          placeholder="news@example.com"
          required
          className="w-full px-4 py-2.5 rounded-lg bg-canvas border border-border-subtle focus:border-accent outline-none transition-colors"
        />
      </div>

      {/* 개발 경력 */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-text-primary">
          {t("experience")}
        </label>
        <select
          name="experience"
          required
          className="w-full px-4 py-2.5 rounded-lg bg-canvas border border-border-subtle focus:border-accent outline-none transition-colors appearance-none"
        >
          <option value="entry">{t("exp1")}</option>
          <option value="junior">{t("exp2")}</option>
          <option value="middle">{t("exp3")}</option>
          <option value="senior">{t("exp4")}</option>
        </select>
      </div>

      {/* 관심 분야 (태그 클라우드 형태) */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-text-primary">
          {t("interests")}
        </label>
        <div className="flex flex-wrap gap-2">
          {interestsList.map((interest) => (
            <button
              key={interest.id}
              type="button"
              onClick={() => handleInterestToggle(interest.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                selectedInterests.includes(interest.id)
                  ? "bg-accent text-black border-accent"
                  : "bg-canvas text-text-secondary border-border-subtle hover:border-accent"
              }`}
            >
              {interest.label}
            </button>
          ))}
        </div>
      </div>

      {/* 신청 동기 */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-text-primary">
          {t("motivation")}
        </label>
        <textarea
          name="motivation"
          rows={4}
          required
          className="w-full px-4 py-3 rounded-xl bg-canvas border border-border-subtle focus:border-accent outline-none transition-colors resize-none"
          placeholder="Synapso.dev를 통해 어떤 경험을 기대하시나요?"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full py-4 text-lg font-bold shadow-lg shadow-accent/10"
      >
        {loading ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
