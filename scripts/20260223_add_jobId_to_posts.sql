-- posts 테이블에 jobId 컬럼 추가 SQL
-- Supabase Dashboard > SQL Editor에서 실행하세요.

-- 1. jobs 테이블과 연동을 위한 jobId 컬럼 추가
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "jobId" UUID;

-- 2. (선택 사항) jobs 테이블의 id를 참조하도록 외래 키 설정
-- ALTER TABLE posts ADD CONSTRAINT fk_posts_jobId FOREIGN KEY ("jobId") REFERENCES jobs(id) ON DELETE SET NULL;

-- 3. 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_posts_jobId ON posts("jobId");
