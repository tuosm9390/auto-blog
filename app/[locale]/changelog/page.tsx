import { getReleases } from "@/lib/changelog";
import { getTranslations } from "next-intl/server";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn ? "Release Notes | Synapso.dev" : "업데이트 노트 | Synapso.dev",
    description: isEn
      ? "New features, bug fixes, and security updates for Synapso.dev"
      : "Synapso.dev의 새 기능, 버그 수정, 보안 패치 내역을 확인하세요.",
  };
}

export default async function ChangelogPage() {
  const releases = await getReleases().catch(() => []);
  const t = await getTranslations("Changelog");

  if (releases.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-text-secondary">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
          {t("title")}
        </h1>
        <p className="text-text-secondary">{t("subtitle")}</p>
      </div>
      <div className="space-y-10">
        {releases.map((release) => (
          <div key={release.version} className="border-l-2 border-border-subtle pl-6">
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="font-display text-xl font-semibold text-text-primary">
                {release.version}
              </h2>
              <span className="text-sm text-text-secondary">{release.date}</span>
            </div>
            {release.features.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-text-primary mb-2">
                  🚀 {t("features")}
                </h3>
                <ul className="space-y-1">
                  {release.features.map((f, i) => (
                    <li key={i} className="text-sm text-text-secondary flex gap-2">
                      <span className="shrink-0">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {release.fixes.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-text-primary mb-2">
                  🐛 {t("fixes")}
                </h3>
                <ul className="space-y-1">
                  {release.fixes.map((f, i) => (
                    <li key={i} className="text-sm text-text-secondary flex gap-2">
                      <span className="shrink-0">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {release.security.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-text-primary mb-2">
                  🔒 {t("security")}
                </h3>
                <ul className="space-y-1">
                  {release.security.map((s, i) => (
                    <li key={i} className="text-sm text-text-secondary flex gap-2">
                      <span className="shrink-0">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {release.other.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-text-primary mb-2">
                  ♻️ {t("other")}
                </h3>
                <ul className="space-y-1">
                  {release.other.map((o, i) => (
                    <li key={i} className="text-sm text-text-secondary flex gap-2">
                      <span className="shrink-0">•</span>
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
