-- profiles 테이블에 email 컬럼 추가
alter table public.profiles add column if not exists email text;

-- 보안 강화: 권한 체크는 반드시 id(PK)를 기준으로 수행하도록 인덱스 재확인
create index if not exists idx_profiles_role_id on public.profiles(id, role);

-- 기존 데이터 마이그레이션 (필요 시)
-- update public.profiles set email = 'unknown' where email is null;
