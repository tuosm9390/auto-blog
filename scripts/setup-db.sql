-- Auto-Blog 자동/수동 포스팅 기능 추가 SQL
-- Supabase Dashboard > SQL Editor에서 실행

-- 1. user_settings 테이블
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_username TEXT UNIQUE NOT NULL,
  posting_mode TEXT DEFAULT 'manual' CHECK (posting_mode IN ('auto', 'manual')),
  auto_repos TEXT[] DEFAULT '{}',
  auto_schedule TEXT DEFAULT 'daily' CHECK (auto_schedule IN ('daily', 'weekly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own settings" ON user_settings;
CREATE POLICY "Users can manage own settings"
  ON user_settings FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. processed_commits 테이블
CREATE TABLE IF NOT EXISTS processed_commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_username TEXT NOT NULL,
  repo TEXT NOT NULL,
  commit_sha TEXT NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(repo, commit_sha)
);

ALTER TABLE processed_commits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own commits" ON processed_commits;
CREATE POLICY "Users can manage own commits"
  ON processed_commits FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. posts 테이블 컬럼 추가
ALTER TABLE posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published'
  CHECK (status IN ('draft', 'published'));
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author TEXT DEFAULT '';
