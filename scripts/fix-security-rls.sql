-- 보안 강화 및 멱등성 지원을 위한 SQL
-- 1. Stripe 이벤트 추적 테이블
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY, -- Stripe Event ID (evt_...)
  type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS 정책 강화 (Using auth.uid() or relevant criteria)
-- user_settings
DROP POLICY IF EXISTS "Users can manage own settings" ON user_settings;
CREATE POLICY "Users can manage own settings"
  ON user_settings FOR ALL
  USING (github_username = (auth.jwt() ->> 'username'))
  WITH CHECK (github_username = (auth.jwt() ->> 'username'));

-- processed_commits
DROP POLICY IF EXISTS "Users can manage own commits" ON processed_commits;
CREATE POLICY "Users can manage own commits"
  ON processed_commits FOR ALL
  USING (github_username = (auth.jwt() ->> 'username'))
  WITH CHECK (github_username = (auth.jwt() ->> 'username'));

-- posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own posts" ON posts;
CREATE POLICY "Users can manage own posts"
  ON posts FOR ALL
  USING (author = (auth.jwt() ->> 'username'))
  WITH CHECK (author = (auth.jwt() ->> 'username'));

-- jobs (만약 존재한다면)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own jobs" ON jobs;
CREATE POLICY "Users can manage own jobs"
  ON jobs FOR ALL
  USING (github_username = (auth.jwt() ->> 'username'))
  WITH CHECK (github_username = (auth.jwt() ->> 'username'));
