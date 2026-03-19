-- =============================================================
-- Synapso.dev Marketing Phase 0 Security Migration
-- 실행 위치: Supabase Dashboard → SQL Editor
-- 실행 전 백업 권장
-- =============================================================

-- -------------------------------------------------------
-- STEP 0.1: profiles 테이블의 permissive RLS 정책 제거
-- 이유: USING(true) 정책이 존재하면 다른 restrictive 정책과
--       관계없이 모든 인증 사용자가 모든 행에 접근 가능
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Users can modify their own profile." ON profiles;

-- 확인 쿼리 (using_expr이 'true'인 항목이 없어야 함)
SELECT policyname, cmd, using_expr, with_check_expr
FROM pg_policies
WHERE tablename = 'profiles';

-- -------------------------------------------------------
-- STEP 0.2: user_integrations 테이블 생성
-- 목적: Dev.to 등 외부 플랫폼 API 키를 암호화하여 저장
--       클라이언트 키로는 접근 불가 (USING(false))
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL REFERENCES profiles(username) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('devto', 'hashnode', 'medium')),
  api_key_encrypted TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (username, platform)
);

ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- 클라이언트 키로는 완전히 접근 차단 (supabaseAdmin service_role만 접근 가능)
CREATE POLICY "Server-only access"
  ON user_integrations
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- -------------------------------------------------------
-- STEP 0.3: post_publications 테이블 생성
-- 목적: Dev.to 등 외부 플랫폼 배포 이력 추적
--       Free 플랜 월 배포 횟수 제한에 사용
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL REFERENCES profiles(username) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('devto', 'hashnode', 'medium')),
  external_id TEXT,
  external_url TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('pending', 'published', 'failed')),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, platform)
);

ALTER TABLE post_publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own publications"
  ON post_publications FOR ALL
  USING (username = (SELECT username FROM profiles WHERE id = auth.uid()::text));

-- Free 플랜 월 배포 횟수 카운트 쿼리 최적화
CREATE INDEX IF NOT EXISTS idx_post_publications_monthly
  ON post_publications (username, platform, published_at);

-- -------------------------------------------------------
-- 완료 확인 쿼리
-- -------------------------------------------------------
SELECT 'user_integrations' AS table_name, COUNT(*) FROM user_integrations
UNION ALL
SELECT 'post_publications', COUNT(*) FROM post_publications;
