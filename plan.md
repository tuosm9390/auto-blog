# Auto-Blog 자동 포스팅 모드 문제점 분석 및 개선 계획

> 분석 기준일: 2026-02-28
> 분석 대상 파일: `app/api/generate/route.ts`, `app/api/jobs/[id]/route.ts`,
> `app/api/cron/auto-post/route.ts`, `lib/jobs.ts`, `lib/subscription.ts`,
> `components/GenerateForm.tsx`, `app/settings/page.tsx`

---

## 1. 발견된 문제점 목록

---

### [문제 #1] 취소 시 사용량이 차감되는 버그 ⚠️ (사용자 신고 항목)

**파일**: `app/api/generate/route.ts` (line 99), `app/api/jobs/[id]/route.ts` (line 41)

**현재 동작 흐름:**
```
POST /api/generate
  → Job 생성 (pending)
  → incrementUsage() 호출 ← 여기서 바로 차감
  → 백그라운드 분석 시작 (fire-and-forget)
  → jobId 반환

DELETE /api/jobs/[id]
  → deleteJob(id) 호출 (DB에서 삭제)
  → ❌ 사용량 롤백 없음
```

**문제점:**
- `incrementUsage()`가 Job 생성 직후(분석 시작 전)에 호출됨
- 사용자가 Job을 취소(DELETE)해도 `usage_count_month`가 롤백되지 않음
- 결과적으로 분석이 완료되지 않아도 사용량이 차감됨

**영향 범위:** Manual 모드 전체 사용자 (Auto 모드는 cron에서 분석 완료 후 차감하므로 무관)

---

### [문제 #2] Auto 모드와 Manual 모드 간 사용량 차감 시점 불일치 ⚠️

**파일**: `app/api/generate/route.ts` vs `app/api/cron/auto-post/route.ts`

**Manual 모드 (`/api/generate`):**
```typescript
// route.ts line 99 - Job 생성 직후 차감 (분석 완료 전)
await incrementUsage(username);
runAIAnalysisBackground(...).catch(console.error); // 비동기, 미완료 상태
```

**Auto 모드 (`/api/cron/auto-post`):**
```typescript
// route.ts line 89 - AI 분석 성공 후 차감 (올바른 패턴)
analysisResult = await analyzeCommits(commitDiffs, repo, tier);
await incrementUsage(user.github_username); // 분석 완료 후 차감
```

**문제점:**
- Auto 모드는 분석 완료 후 차감(올바름)
- Manual 모드는 분석 시작 전 차감(잘못됨)
- 동일 플랫폼에서 모드에 따라 사용량 정책이 달라 사용자 혼란 유발

---

### [문제 #3] Auto 모드에서 개인 레포 접근에 공용 토큰 사용 🔒

**파일**: `app/api/cron/auto-post/route.ts` (line 63)

```typescript
// 현재 코드 - 모든 사용자의 Private 레포를 서버의 공용 GITHUB_TOKEN으로 접근
const unprocessed = await getUnprocessedCommits(
  user.github_username,
  repo,
  process.env.GITHUB_TOKEN || ""  // ← 서버 공용 토큰
);
```

**문제점:**
- 사용자 개인 OAuth 토큰이 아닌 서버 레벨의 `GITHUB_TOKEN` 사용
- 해당 토큰이 각 사용자의 Private 레포에 접근 권한이 없을 경우 자동 포스팅 실패
- 에러가 조용히 묻히고 사용자에게 알림 없음

---

### [문제 #4] auto_schedule 설정이 실제 크론 주기에 반영되지 않음 📅

**파일**: `app/settings/page.tsx`, `vercel.json`

**현재 동작:**
- UI에서 "매일" / "매주" 선택 가능 → DB `user_settings.auto_schedule`에 저장됨
- 크론 엔드포인트(`/api/cron/auto-post`)는 Vercel Cron 설정에 따라 **고정 주기**로 실행됨
- DB의 `auto_schedule` 값은 실제 크론 실행 로직에서 **전혀 사용되지 않음**

**문제점:**
- 사용자가 "매주"로 설정해도 크론이 매일 실행되면 매일 분석 실행
- UI에서 제공하는 선택지가 실제로 동작하지 않는 Dead feature

---

### [문제 #5] Auto 모드 설명 문구와 실제 동작 불일치 📝

**파일**: `app/settings/page.tsx` (line 251-252), `app/api/cron/auto-post/route.ts` (line 99)

**UI 설명 (settings/page.tsx):**
```
"자동 모드를 활성화하면 선택한 레포의 새로운 커밋을 자동으로 분석하여
 초안을 생성합니다. 직접 발행 여부를 결정할 수 있습니다."
```

**실제 cron 동작:**
```typescript
const created = await createPost(analysisResult.title, analysisResult.content, {
  ...
  status: "published",  // ← 초안이 아닌 즉시 발행
  ...
});
```

**문제점:**
- 사용자는 "초안 생성 후 직접 발행"을 기대하지만
- 실제로는 분석 즉시 `published` 상태로 자동 발행됨
- 사용자 동의 없는 게시 → 신뢰도 저하, 내용 오류 시 수정 불가

---

### [문제 #6] Auto 모드 실패 시 사용자 알림 없음 🔔

**파일**: `app/api/cron/auto-post/route.ts`

**현재 동작:**
```typescript
} catch (repoError) {
  console.error(`자동 포스팅 실패 [${user.github_username}/${repo}]:`, repoError);
  results.push({ username: user.github_username, repo, status: "error" });
  // ← 사용자에게 이메일, 알림 등 일체 없음
}
```

**문제점:**
- AI 분석 실패, GitHub 접근 실패, 쿼터 초과 등 다양한 실패 케이스에서
- 사용자가 실패 사실을 알 방법이 없음
- Jobs 페이지에도 cron 실행 결과가 표시되지 않음 (cron 분석은 `jobs` 테이블 미사용)

---

### [문제 #7] Free 티어 Auto 레포 제한 경고 미표시 ⚙️

**파일**: `app/settings/page.tsx`, `app/api/cron/auto-post/route.ts` (line 47)

**현재 동작:**
```typescript
// cron - Free 티어는 1개 레포만 처리 (슬라이싱으로 제한)
const eligibleRepos = tier === "free"
  ? user.auto_repos.slice(0, tierLimits.maxAutoRepos)  // maxAutoRepos = 1
  : user.auto_repos;
```

**문제점:**
- Free 사용자가 자동 포스팅 레포를 2개 이상 선택해도 UI에서 막지 않음
- 선택은 가능하지만 실제 크론에서 첫 번째 레포만 처리됨
- 사용자는 왜 나머지 레포가 처리되지 않는지 알 수 없음

---

### [문제 #8] 인메모리 Rate Limiter의 멀티 인스턴스 취약성 ⚡

**파일**: `app/api/generate/route.ts` (line 18-20)

```typescript
// 서버 재시작 또는 스케일아웃 시 초기화됨
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
```

**문제점:**
- Vercel Serverless 환경에서 인스턴스가 여러 개 뜨면 각 인스턴스가 별도의 Map 보유
- 사용자가 서로 다른 인스턴스로 요청 시 Rate Limit 우회 가능
- 서버 재시작 시 Rate Limit 초기화

---

## 2. 개선 구현 계획

---

### [구현 #1] 취소 시 사용량 차감 방지 (최우선 수정)

**목표:** Manual 모드에서 분석 완료 전 Job 취소 시 사용량을 차감하지 않음

#### Step 1 — `lib/subscription.ts`에 `decrementUsage()` 함수 추가

```typescript
// lib/subscription.ts에 추가
// 사용량 1 감소 (취소 시 롤백용)
export async function decrementUsage(username: string): Promise<void> {
  const { data } = await supabase
    .from("profiles")
    .select("usage_count_month")
    .eq("username", username)
    .single();

  const currentCount = data?.usage_count_month ?? 0;
  if (currentCount <= 0) return; // 0 이하로 내려가지 않도록 방어

  await supabase
    .from("profiles")
    .update({ usage_count_month: currentCount - 1 })
    .eq("username", username);
}
```

#### Step 2 — `app/api/jobs/[id]/route.ts` DELETE 핸들러 수정

```typescript
// 삭제 전 Job 상태 확인
// pending/processing 상태일 때만 사용량 롤백
import { decrementUsage } from "@/lib/subscription";

export async function DELETE(...) {
  ...
  const job = await getJobById(id);

  // 분석이 완료되지 않은 상태에서 취소 시 사용량 롤백
  // (completed/failed는 이미 결과가 나온 것이므로 차감 유지)
  if (job.status === "pending" || job.status === "processing") {
    await decrementUsage(job.github_username);
  }

  await deleteJob(id);
  return NextResponse.json({ success: true });
}
```

#### Step 3 — 현재 잘못된 차감 시점 수정 (선택적 개선)

현재 `incrementUsage`가 분석 시작 전에 호출되는 구조는,
취소 롤백으로 해결 가능하지만 장기적으로는 분석 완료 후 차감으로 개선 권장:

```typescript
// app/api/generate/route.ts - 현재 (분석 전 차감)
const job = await createJob(username, `${owner}/${repo}`, shas);
await incrementUsage(username);  // ← 여기
runAIAnalysisBackground(job.id, owner, repo, shas, usage.tier).catch(console.error);

// 개선안 (분석 완료 후 lib/jobs.ts의 runAIAnalysisBackground 내부에서 차감)
// → jobs.ts의 updateJobStatus("completed") 호출 직전에 incrementUsage 이동
```

---

### [구현 #2] Auto 모드 전환 시 경고 문구 표시

**목표:** 사용자가 Auto 모드로 전환할 때 명확한 경고를 표시

**파일**: `app/settings/page.tsx`

**추가할 경고 박스 (Auto 모드 섹션 하단):**

```tsx
{settings.posting_mode === "auto" && (
  <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-xl p-4 text-sm">
    <p className="font-semibold text-yellow-500 mb-1">⚠ 자동 포스팅 모드 안내</p>
    <p className="text-text-secondary leading-relaxed">
      자동 포스팅 설정 시 분석이 완료되면 분석 요청 횟수가 차감됩니다.{" "}
      <strong className="text-text-primary">Manual 모드로 진행하실 경우는 분석 완료 전 취소가 가능합니다.</strong>{" "}
      이 점 유의해 주세요.
    </p>
  </div>
)}
```

**Manual 모드 GenerateForm에도 추가할 안내 (generating 상태 진입 전):**

```tsx
// components/GenerateForm.tsx - generatePost 함수 내 또는 버튼 하단
<p className="text-xs text-text-tertiary mt-2">
  * Manual 모드: 분석 완료 전 취소 가능, 취소 시 횟수 차감 없음
</p>
```

---

### [구현 #3] Auto 모드 실제 동작 수정 (초안으로 생성)

**파일**: `app/api/cron/auto-post/route.ts` (line 99)

```typescript
// 현재 - 즉시 published
const created = await createPost(analysisResult.title, analysisResult.content, {
  status: "published",  // ← 변경 필요
  ...
});

// 개선 - draft로 생성하여 사용자 확인 후 발행 가능
const created = await createPost(analysisResult.title, analysisResult.content, {
  status: "draft",  // 사용자가 Jobs/Drafts 페이지에서 검토 후 발행
  ...
});
```

---

### [구현 #4] Free 티어 Auto 레포 선택 시 UI 제한

**파일**: `app/settings/page.tsx`

```tsx
// toggleRepo 함수 수정
const toggleRepo = (fullName: string) => {
  if (!settings) return;
  const current = settings.auto_repos || [];
  const isFree = subscription?.tier === "free";
  const maxRepos = isFree ? 1 : Infinity;

  if (!current.includes(fullName) && current.length >= maxRepos) {
    toast.error("Free 플랜은 자동 포스팅 레포를 1개만 선택할 수 있습니다.");
    return;
  }

  const updated = current.includes(fullName)
    ? current.filter((r) => r !== fullName)
    : [...current, fullName];
  setSettings({ ...settings, auto_repos: updated });
};
```

---

## 3. 구현 우선순위

| 우선순위 | 구현 항목 | 난이도 | 영향도 |
|---|---|---|---|
| **P0** | [#1] 취소 시 사용량 롤백 (`decrementUsage` + DELETE 핸들러 수정) | 낮음 | 높음 |
| **P0** | [#2] Auto 모드 경고 문구 표시 (`settings/page.tsx`) | 매우 낮음 | 높음 |
| **P1** | [#3] Auto 모드 즉시 발행 → 초안 생성으로 변경 | 낮음 | 높음 |
| **P1** | [#4] Free 티어 레포 선택 제한 UI | 낮음 | 중간 |
| **P2** | [#5] auto_schedule 실제 크론 반영 | 높음 | 중간 |
| **P2** | [#6] Auto 모드 실패 알림 추가 | 중간 | 중간 |
| **P3** | [#7] Rate Limiter Redis 전환 | 높음 | 낮음 |

---

## 4. P0 구현 상세 (즉시 작업 대상)

### 4-1. `lib/subscription.ts` — `decrementUsage` 추가

```typescript
/**
 * 사용량 1 감소 (Manual 모드에서 분석 취소 시 롤백용)
 * usage_count_month가 0 이하로 내려가지 않도록 방어 처리
 */
export async function decrementUsage(username: string): Promise<void> {
  const { data } = await supabase
    .from("profiles")
    .select("usage_count_month")
    .eq("username", username)
    .single();

  const currentCount = data?.usage_count_month ?? 0;
  if (currentCount <= 0) return;

  await supabase
    .from("profiles")
    .update({ usage_count_month: currentCount - 1 })
    .eq("username", username);
}
```

### 4-2. `app/api/jobs/[id]/route.ts` — DELETE 핸들러 수정

```typescript
import { decrementUsage } from "@/lib/subscription";

export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const job = await getJobById(id);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (job.github_username !== session.user.username)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 분석 미완료 상태에서 취소 시 사용량 롤백
  if (job.status === "pending" || job.status === "processing") {
    await decrementUsage(job.github_username);
  }

  await deleteJob(id);
  return NextResponse.json({ success: true });
}
```

### 4-3. `app/settings/page.tsx` — Auto 모드 경고 문구 추가

```tsx
{/* Auto 모드 활성화 시 경고 박스 (toggleMode 버튼 바로 아래) */}
{settings.posting_mode === "auto" && (
  <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-xl p-4 text-sm space-y-1">
    <p className="font-semibold text-yellow-500">⚠ 자동 포스팅 모드 안내</p>
    <p className="text-text-secondary leading-relaxed">
      자동 포스팅 설정 시 분석이 완료되면 분석 요청 횟수가 차감됩니다.{" "}
      <strong className="text-text-primary">
        Manual 모드로 진행하실 경우는 분석 완료 전 취소가 가능합니다.
      </strong>{" "}
      이 점 유의해 주세요.
    </p>
  </div>
)}
```

---

*문서 작성: Claude (claude-sonnet-4-6) | 브랜치: `claude/add-claude-documentation-efbBr`*
