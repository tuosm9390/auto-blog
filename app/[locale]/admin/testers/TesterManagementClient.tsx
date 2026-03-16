"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Application {
  id: string;
  github_username: string;
  email: string;
  github_email: string;
  experience: string;
  interests: string[];
  motivation: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  profiles: {
    username: string;
    name: string | null;
    avatar_url: string | null;
  };
}

export default function TesterManagementClient() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("TesterApply");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/admin/testers");
      const data = await res.json();
      if (res.ok) setApplications(data);
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (
    id: string,
    status: "approved" | "rejected" | "pending",
  ) => {
    const confirmMsg =
      status === "approved"
        ? "승인"
        : status === "rejected"
          ? "거절"
          : "초기화";
    if (!confirm(`${confirmMsg}하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/admin/testers/` + id, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setApplications((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status } : app)),
        );
      } else {
        alert("처리에 실패했습니다.");
      }
    } catch (err) {
      alert("오류가 발생했습니다.");
    }
  };

  if (loading)
    return (
      <div className="text-center py-20 text-text-tertiary">
        데이터를 불러오는 중...
      </div>
    );

  return (
    <div className="space-y-6">
      {applications.length === 0 ? (
        <Card className="p-12 text-center text-text-secondary">
          신청 내역이 없습니다.
        </Card>
      ) : (
        <div className="grid gap-6">
          {applications.map((app) => (
            <Card
              key={app.id}
              className="p-6 overflow-hidden border-border-subtle hover:border-border-strong transition-all"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 space-y-4">
                  {/* 헤더: 사용자 정보 */}
                  <div className="flex items-center gap-3">
                    {app.profiles.avatar_url && (
                      <img
                        src={app.profiles.avatar_url}
                        alt={app.github_username}
                        className="w-10 h-10 rounded-full border border-border-subtle"
                      />
                    )}
                    <div>
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        {app.profiles.name || app.github_username}
                        <span className="text-sm font-normal text-text-tertiary">
                          (@{app.github_username})
                        </span>
                      </h3>
                      <p className="text-xs text-text-tertiary">
                        {new Date(app.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div
                      className={`ml-auto px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`}
                    >
                      {app.status}
                    </div>
                  </div>

                  {/* 상세 정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-canvas/50 p-4 rounded-xl border border-border-subtle/50">
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">
                        연락처 / GitHub
                      </p>
                      <p className="text-sm font-medium">{app.email}</p>
                      <p className="text-xs text-text-tertiary">
                        {app.github_email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">경력</p>
                      <p className="text-sm font-medium">
                        {t(
                          "exp" +
                            (app.experience === "entry"
                              ? "1"
                              : app.experience === "junior"
                                ? "2"
                                : app.experience === "middle"
                                  ? "3"
                                  : "4"),
                        )}
                      </p>
                    </div>
                  </div>

                  {/* 관심 분야 */}
                  <div>
                    <p className="text-xs text-text-tertiary mb-2">관심 분야</p>
                    <div className="flex flex-wrap gap-1.5">
                      {app.interests.map((interest) => (
                        <span
                          key={interest}
                          className="px-2 py-0.5 bg-accent/5 text-accent border border-accent/10 rounded-md text-[11px] font-semibold"
                        >
                          {interest.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 신청 동기 */}
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">신청 동기</p>
                    <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">
                      {app.motivation}
                    </p>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex md:flex-col gap-2 justify-end min-w-[120px]">
                  {app.status === "pending" && (
                    <>
                      <Button
                        onClick={() => updateStatus(app.id, "approved")}
                        className="bg-green-600 hover:bg-green-700 text-white border-none shadow-sm"
                      >
                        승인하기
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => updateStatus(app.id, "rejected")}
                        className="text-red-500 hover:bg-red-500/10 border-red-500/20"
                      >
                        거절
                      </Button>
                    </>
                  )}
                  {app.status !== "pending" && (
                    <Button
                      variant="secondary"
                      onClick={() => updateStatus(app.id, "pending")}
                      className="text-text-tertiary hover:bg-elevated text-xs"
                    >
                      상태 초기화
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
