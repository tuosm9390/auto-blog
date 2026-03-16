import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import TesterApplyForm from "./TesterApplyForm";

export default async function TesterApplyPage() {
  const session = await auth();
  const t = await getTranslations("TesterApply");

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as any)?.role || 'user';
  if (role === 'admin' || role === 'tester') {
    // 이미 권한이 있는 경우 포스트 관리 페이지로 리다이렉트
    redirect("/jobs");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
          {t("title")}
        </h1>
        <p className="text-text-secondary text-lg">
          {t("desc")}
        </p>
      </div>

      <div className="bg-surface border border-border-subtle rounded-2xl p-8 shadow-sm">
        <TesterApplyForm 
          user={{
            id: session.user.id!,
            name: session.user.name!,
            username: (session.user as any).username!,
            email: session.user.email!
          }} 
        />
      </div>
    </div>
  );
}
