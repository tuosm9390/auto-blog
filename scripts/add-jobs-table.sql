-- AI 분석 백그라운드 작업을 위한 jobs 테이블 추가
-- Supabase Dashboard > SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_username TEXT NOT NULL,
  repo TEXT NOT NULL,
  commit_shas TEXT[] NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_jobs_username ON jobs(github_username);

-- RLS 설정
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own jobs" ON jobs;
CREATE POLICY "Users can manage own jobs"
  ON jobs FOR ALL
  USING (true)
  WITH CHECK (true);
