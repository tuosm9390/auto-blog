Date: 2026-03-16 12:07:04
Author: Antigravity

# 📝 Posts & AI Job Execution (v0.5.0)

## 1. Post Creation (AI Generate)
- **Role Requirement**: dmin 또는 	ester 권한이 있는 사용자만 /generate API를 호출할 수 있습니다.
- **Privacy First**: AI 분석은 트랜지언트(Transient) 방식으로 수행되며, 사용자 코드는 학습 데이터로 저장되지 않습니다. (Zero Data Retention)

## 2. Job Queue (Supabase)
- 모든 AI 생성 요청은 jobs 테이블에 기록되며, 비동기 큐 방식으로 처리됩니다.
- 각 작업은 해당 유저의 user_id를 소유하며, RLS 정책에 따라 본인만 조회 가능합니다.

## 3. GitHub Integration
- Octokit을 통해 사용자의 레포지토리와 커밋 데이터를 가져오며, 사용자 본인이 선택한 레포지토리에 대해서만 분석을 수행합니다.
