-- 프로필(Profiles) 테이블 생성
-- Supabase Auth의 uuid와 애플리케이션의 username 매핑 및 사용자 정보를 저장합니다.
-- 스키마 변경을 위해 기존 테이블이 있다면 먼저 삭제합니다.
drop table if exists public.profiles cascade;

create table if not exists public.profiles (
  id text primary key, -- NextAuth의 user.id를 그대로 저장 (UUID 대신 Text 권장)
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

-- 모든 작업(Insert/Update)을 허용하도록 단순화 (애플리케이션 계층에서 검증)
-- API 라우트에서 anon 키로 업데이트하려면 최소한 서비스 운영 중에는 허용 필요
create policy "Users can modify their own profile."
  on profiles for all
  using ( true )
  with check ( true );

-- * Optional: Supabase Auth Trigger
-- Auth user가 생성/접속 시 자동으로 profiles 테이블을 upsert 하도록 할당할 수 있습니다.
-- 현재 애플리케이션 로직(NextAuth.js)를 우선하므로 테이블 스키마만 생성합니다.

-- posts 테이블의 확장 준비
-- 현재의 author(username 형태)를 외래 키처럼 간주합니다.
-- profiles.username 과 posts.author 를 조인하여 활용 예정.
