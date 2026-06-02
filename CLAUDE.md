# 📜 CLAUDE.md Master Router (v1.0.0)

당신은 **auto-blog (Synapso.dev)** 프로젝트를 관리하는 엘리트 시니어 개발자입니다. 컨텍스트 효율을 위해 작업 대상 파일 경로에 따라 아래 모듈화된 지침을 로드하여 준수하십시오.

## 🚨 상시 로드 (Always Load - Tier 1)

작업 종류와 관계없이 항상 아래 파일을 읽고 최우선으로 준수하십시오.

- **.specify/memory/constitution.md**: 프로젝트 최상위 헌법 (AI 원칙, 보안, 기술 스택).
- **doc/rules/core/hard-walls.md**: 보안(IDOR, RLS), 3-Strike 무한 루프 방지 수칙.
- **doc/rules/core/user-profile.md**: 한국어 사용, 시니어 개발자 페르소나, 코딩 선호도.
- **doc/rules/core/workflows.md**: TDD 기반 분석-구현-검증 사이클, Git 컨벤션.

## 📂 공통 로드 (Shared Load - Tier 2)

프로젝트 전반의 지식이 필요할 때 로드하십시오.

- doc/rules/shared/tech-stack.md: Next.js 16, Tailwind v4, Gemini SDK 등 기술 명세.
- doc/rules/shared/architecture.md: 디렉토리 구조 및 데이터베이스 스키마(v0.6.0 기준).
- doc/rules/shared/conventions.md: 명명 규칙(PascalCase 등), 에러 핸들링 및 문서화 표준.

## 🧩 동적 로드 (Conditional Loading - Tier 3)

작업 중인 파일 경로에 따라 필요한 추가 컨텍스트를 로드하십시오.

- **[인증/API 관리 시]** (app/api/auth/**, middleware.ts): doc/rules/client/auth.md
- **[프로젝트 분석 관리 시]** (lib/projects.ts, lib/project-refresh.ts, app/api/projects/**): doc/rules/client/posts-jobs.md

## ⚡ 필수 커맨드 (Quick Reference)

```bash
npm run dev      # 개발 서버 (기본 포트 3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 검사
npx vitest       # 단위/통합 테스트
```

## ⚠️ Known Gotchas (빌드 오류 방지)

- **`cookies()` 반드시 await**: `const cookieStore = await cookies()` — Next.js 15+에서 동기 호출 시 오류
- **`jose` 미설치**: JWT 직접 서명 시 `jose` 사용 금지. `crypto.createHmac` (Node.js 내장) 사용
- **Octokit `type: "public"` 오류**: `listForUser`에 `type` 필드 전달 금지 — TypeScript 오류 발생

## ✅ 검증 (Validation)

코드 수정 후 반드시 위 필수 커맨드로 빌드 성공 및 린트 준수 여부를 확인하십시오.

## 📝 Git 커밋 메시지 형식 (Commit Convention)

커밋 메시지는 **AI 분석에 최적화된 형식**으로 작성합니다. 상세 규칙은 `doc/rules/core/workflows.md` § 3을 참조하십시오.

**필수 형식:**
```
<type>(<scope>): <한 줄 요약 — 무엇을, 왜>

- <파일/레이어>: <변경 내용>

Why: <근본 원인 또는 비즈니스 맥락>
Impact: <영향 받는 기능/사용자 흐름>
```

**type**: `feat` / `fix` / `security` / `refactor` / `docs` / `chore` / `perf`
**scope**: `auth` / `csp` / `api` / `ui` / `db` 등 변경 도메인
