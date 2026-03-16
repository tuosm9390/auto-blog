import { requireAdminAuth } from "@/lib/api-utils";
import { getTranslations } from "next-intl/server";
import TesterManagementClient from "./TesterManagementClient";

export default async function AdminTestersPage() {
  await requireAdminAuth();
  const t = await getTranslations("TesterApply");

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-display font-bold mb-2">⚙️ 테스터 관리 대시보드</h1>
        <p className="text-text-secondary">
          신청한 사용자들의 내역을 확인하고 승인/거절 처리를 진행합니다.
        </p>
      </div>

      <TesterManagementClient />
    </div>
  );
}
