import { auth } from "@/auth";
import { redirect } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import { Link } from "@/i18n/routing";

export default async function AdminDashboardPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (role !== "admin") redirect({ href: "/", locale: "ko" });

  const t = await getTranslations("Header");
  const tD = await getTranslations("Admin.Dashboard");

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-text-primary mb-2">
          {t("adminDashboard")}
        </h1>
        <p className="text-text-secondary">{tD("Subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="p-6 hover:border-accent/30 transition-all group">
          <div className="flex flex-col h-full">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">👥</span>
            </div>
            <h2 className="text-xl font-bold mb-2">{t("adminUsers")}</h2>
            <p className="text-sm text-text-secondary mb-6 flex-grow">
              {tD("UserDesc")}
            </p>
            <Link
              href="/admin/users"
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg font-semibold hover:bg-blue-500/20 transition-colors"
            >
              {tD("UserLink")}
            </Link>
          </div>
        </Card>
        <Card className="p-6 hover:border-accent/30 transition-all group">
          <div className="flex flex-col h-full">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">💳</span>
            </div>
            <h2 className="text-xl font-bold mb-2">{t("adminSubs")}</h2>
            <p className="text-sm text-text-secondary mb-6 flex-grow">
              {tD("SubDesc")}
            </p>
            <Link
              href="/admin/subscriptions"
              className="inline-flex items-center justify-center px-4 py-2 bg-purple-500/10 text-purple-400 rounded-lg font-semibold hover:bg-purple-500/20 transition-colors"
            >
              {tD("SubLink")}
            </Link>
          </div>
        </Card>
        <Card className="p-6 border-accent/20 bg-accent/5 hover:border-accent/50 transition-all group">
          <div className="flex flex-col h-full">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">✦</span>
            </div>
            <h2 className="text-xl font-bold mb-2">{t("testerStatus")}</h2>
            <p className="text-sm text-text-secondary mb-6 flex-grow">
              {tD("TesterDesc")}
            </p>
            <Link
              href="/admin/testers"
              className="inline-flex items-center justify-center px-4 py-2 bg-accent text-black rounded-lg font-bold hover:bg-accent-hover transition-colors"
            >
              {tD("TesterLink")}
            </Link>
          </div>
        </Card>
      </div>

      <div className="bg-elevated/50 rounded-2xl p-8 border border-border-subtle">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {tD("SystemStatus")}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-2xl font-display font-bold">Normal</p>
            <p className="text-xs text-text-secondary uppercase">
              {tD("ApiStatus")}
            </p>
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-accent">99.9%</p>
            <p className="text-xs text-text-secondary uppercase">
              {tD("Uptime")}
            </p>
          </div>
          <div>
            <p className="text-2xl font-display font-bold">DB-01</p>
            <p className="text-xs text-text-secondary uppercase">
              {tD("Database")}
            </p>
          </div>
          <div>
            <p className="text-2xl font-display font-bold">v0.5.0</p>
            <p className="text-xs text-text-secondary uppercase">
              {tD("Version")}
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
