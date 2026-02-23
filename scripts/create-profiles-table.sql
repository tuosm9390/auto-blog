-- 프로필(Profiles) 테이블 생성
-- Supabase Auth의 uuid와 애플리케이션의 username 매핑 및 사용자 정보를 저장합니다.

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  name text,
  avatar_url text,
  bio text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS (Row Level Security) 설정
alter table public.profiles enable row level security;

-- 누구나 프로필을 읽을 수 있음
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

-- 프로필 수정은 본인만 가능
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- * Optional: Supabase Auth Trigger
-- Auth user가 생성/접속 시 자동으로 profiles 테이블을 upsert 하도록 할당할 수 있습니다.
-- 현재 애플리케이션 로직(NextAuth.js)를 우선하므로 테이블 스키마만 생성합니다.

-- posts 테이블의 확장 준비
-- 현재의 author(username 형태)를 외래 키처럼 간주합니다.
-- profiles.username 과 posts.author 를 조인하여 활용 예정.
