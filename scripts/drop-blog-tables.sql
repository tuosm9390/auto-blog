-- 블로그 포스팅 기능 제거에 따른 테이블 DROP 마이그레이션
-- 실행 위치: Supabase Dashboard > SQL Editor
-- 실행 일자: 2026-05-19
-- 관련 커밋: 462f269 refactor(ui): 블로그 포스팅 기능 전체 제거

-- ⚠️  주의사항
-- 1. 이 작업은 되돌릴 수 없습니다. 실행 전 데이터 백업을 권장합니다.
-- 2. processed_commits → posts FK 의존성으로 인해 아래 순서를 반드시 지켜야 합니다.
-- 3. 실행 전 운영 트래픽이 없는 시간대를 선택하세요.

-- ─── STEP 1: 의존 테이블 먼저 삭제 ───────────────────────────────────────────

-- processed_commits: posts(id) FK 참조, 블로그 자동포스팅 전용
DROP TABLE IF EXISTS public.processed_commits CASCADE;

-- user_settings: posting_mode, auto_repos, auto_schedule 저장, 블로그 전용
DROP TABLE IF EXISTS public.user_settings CASCADE;

-- ─── STEP 2: 핵심 블로그 테이블 삭제 ──────────────────────────────────────────

-- jobs: AI 생성 작업 큐, 블로그 전용
DROP TABLE IF EXISTS public.jobs CASCADE;

-- posts: 블로그 포스트 본체
DROP TABLE IF EXISTS public.posts CASCADE;

-- ─── STEP 3: 실행 결과 확인 ───────────────────────────────────────────────────

-- 아래 쿼리 실행 시 4개 테이블 모두 조회되지 않아야 정상
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('posts', 'jobs', 'user_settings', 'processed_commits');

-- 결과가 0행이면 마이그레이션 완료
