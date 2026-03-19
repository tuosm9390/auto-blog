Date: 2026-03-19 14:30:00
Author: Antigravity

# 📝 Posts & AI Job Execution (v0.6.0)

## 1. Post Creation (AI Analysis)
- **Role Requirement**: admin 또는 tester 권한이 검증된 사용자만 `/api/generate` API를 호출할 수 있습니다.
- **Privacy First**: AI 분석은 일시적인 데이터 흐름(Transient) 방식으로 처리되며, 사용자 코드는 어떠한 경우에도 AI 학습용 데이터로 저장되거나 재사용되지 않습니다. (Zero Data Retention)

## 2. Job Queue Pattern
- 모든 AI 생성 요청은 `jobs` 테이블에 기록되며, 비동기 백그라운드 프로세스로 처리됩니다.
- 클라이언트는 `jobId`를 받아 상태(`pending` -> `processing` -> `completed`)를 폴링(Polling)하며 사용자 경험을 최적화합니다.
- 각 작업은 RLS 정책에 의해 소유자 본인만 조회 및 제어가 가능합니다.

## 3. GitHub Data Pipeline
- `Octokit`을 통해 실시간 커밋 diff를 추출합니다.
- `.env`, `node_modules`, lock 파일 및 바이너리 파일은 분석 대상에서 자동으로 제외하여 보안과 토큰 효율을 동시에 확보합니다.
- 분석 결과는 마크다운 형식으로 제공되며, 발행 전 사용자의 최종 편집 과정을 거칩니다.
