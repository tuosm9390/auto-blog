-- 테스터 신청 정보 테이블 생성/수정 (타입 미스매치 해결)
create table if not exists public.tester_applications (
  id uuid default gen_random_uuid() primary key,
  user_id text references public.profiles(id) on delete cascade,
  email text not null,
  github_email text,
  github_username text not null,
  experience text,
  interests text[],
  motivation text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  constraint tester_applications_user_id_unique unique (user_id)
);

-- 테이블이 이미 존재하는 경우 unique constraint 추가
-- (이미 constraint가 있으면 무시됨)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tester_applications_user_id_unique'
  ) then
    alter table public.tester_applications
      add constraint tester_applications_user_id_unique unique (user_id);
  end if;
end $$;

-- RLS 설정
alter table public.tester_applications enable row level security;

-- auth.uid()를 text로 캐스팅하여 비교
create policy "Users can view own applications"
  on tester_applications for select
  using ( auth.uid()::text = user_id );

create policy "Users can insert own applications"
  on tester_applications for insert
  with check ( auth.uid()::text = user_id );

-- 관리자 체크 부분도 동일하게 적용
create policy "Admins can manage all applications"
  on tester_applications for all
  using ( (select role from public.profiles where id = auth.uid()::text) = 'admin' );
