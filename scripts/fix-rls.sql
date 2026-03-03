-- Auto-Blog RLS 강화 (Phase 1)
-- 모든 테이블에 대해 안전한 접근 제어 설정을 적용합니다.
-- psql이나 Supabase Dashboard의 SQL Editor에서 실행하세요.

-- 1. 모든 기존의 위험한 (모두 허용) 정책 제거
DROP POLICY IF EXISTS "Users can manage own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can manage own commits" ON processed_commits;
DROP POLICY IF EXISTS "Users can manage own jobs" ON jobs;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can modify their own profile." ON profiles;

-- (posts 테이블에 만약 기존 정책이 있다면 제거)
-- DROP POLICY IF EXISTS "..." ON posts;

-- 2. profiles: 클라이언트에서 읽기는 허용 (Next.js 클라이언트 등에서 볼 수 있게)
-- 수정/생성은 오직 백엔드(Service Role)에서만 수행
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT
  USING (true);

-- 3. posts: 클라이언트에서 게시된 포스트만 읽기 허용
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published posts are viewable by everyone."
  ON posts FOR SELECT
  USING (status = 'published' AND "deletedAt" IS NULL);

-- 4. user_settings, jobs, processed_commits:
-- 이 테이블들은 전적으로 서버(Service Role Key)를 통해서만 접근됩니다.
-- 따라서 클라이언트(Anon Key)에는 어떠한 권한도 부여하지 않습니다. (비워둠)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_commits ENABLE ROW LEVEL SECURITY;
