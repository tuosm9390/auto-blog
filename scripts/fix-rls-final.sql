-- =============================================================
-- Synapso.dev RLS 최종 보안 수정 (실제 DB 현황 기반)
-- 실행 위치: Supabase Dashboard → SQL Editor
-- 2026-03-29 실제 확인된 6건의 USING(true) 정책 처리
-- =============================================================

-- -------------------------------------------------------
-- STEP 1: jobs 테이블
-- "Allow all operations on jobs" — ALL with USING(true)/WITH CHECK(true)
-- "Authenticated read only" — SELECT with USING(true)
-- 앱은 supabaseAdmin(service_role)만 사용하므로 클라이언트 정책 불필요
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Allow all operations on jobs" ON jobs;
DROP POLICY IF EXISTS "Authenticated read only" ON jobs;

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
-- 클라이언트(anon/authenticated key)에서 접근 완전 차단
-- supabaseAdmin(service_role)은 RLS를 우회하므로 앱 동작에 영향 없음

-- -------------------------------------------------------
-- STEP 2: posts 테이블
-- "Allow all operations on posts" — ALL with USING(true)/WITH CHECK(true) 제거
-- "public_read" — SELECT with USING(true) → 조건부로 교체
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Allow all operations on posts" ON posts;
DROP POLICY IF EXISTS "public_read" ON posts;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 게시된 포스트만 공개 읽기 허용 (draft, 삭제된 포스트 제외)
CREATE POLICY "Published posts are viewable by everyone."
  ON posts FOR SELECT
  USING (status = 'published' AND "deletedAt" IS NULL);

-- -------------------------------------------------------
-- STEP 3: user_settings 테이블
-- "Authenticated can read settings" — SELECT with USING(true) 제거
-- 앱은 supabaseAdmin만 사용하므로 클라이언트 정책 불필요
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can read settings" ON user_settings;
DROP POLICY IF EXISTS "Users can manage own settings" ON user_settings;

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
-- 정책 없음 = 클라이언트 접근 완전 차단 (service_role만 접근 가능)

-- -------------------------------------------------------
-- STEP 4: profiles 테이블
-- "Public profiles are viewable by everyone." (SELECT, USING(true)) — 유지
-- 공개 프로필 조회는 의도된 동작이므로 변경하지 않음
-- -------------------------------------------------------
-- 변경 없음

-- -------------------------------------------------------
-- 적용 결과 확인 (0건이어야 하는 것: ALL/INSERT/UPDATE/DELETE with USING(true))
-- -------------------------------------------------------
SELECT
  tablename,
  policyname,
  cmd,
  qual AS using_expr,
  with_check AS with_check_expr
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd != 'SELECT'
  AND qual = 'true'
ORDER BY tablename;

-- 아래는 SELECT USING(true)만 남아야 함 (profiles만 허용)
SELECT
  tablename,
  policyname,
  cmd,
  qual AS using_expr
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'SELECT'
  AND qual = 'true'
ORDER BY tablename;
-- 기대 결과: profiles 테이블 1건만 존재
