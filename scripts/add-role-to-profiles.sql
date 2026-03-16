-- profiles 테이블에 role 컬럼 추가
alter table public.profiles add column if not exists role text default 'user';

-- 특정 사용자(tuosm)에게 관리자 권한 부여
-- 주의: 실제 GitHub username에 맞게 수정 필요
update public.profiles set role = 'admin' where username = 'tuosm';

-- RLS 정책 업데이트 (관리자용 정책 추가 가능)
create policy "Admins can do everything on profiles"
  on public.profiles for all
  using ( role = 'admin' );

  
