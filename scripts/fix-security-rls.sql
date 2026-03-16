-- profiles 테이블 보안 정책 강화 (타입 미스매치 해결)
drop policy if exists "Users can update their own personal info." on public.profiles;
drop policy if exists "Admins have full access to profiles" on public.profiles;

-- auth.uid()::text 로 수정
create policy "Users can update their own personal info."
  on public.profiles for update
  using ( auth.uid()::text = id )
  with check ( 
    (role = (select role from public.profiles where id = auth.uid()::text))
  );

create policy "Admins have full access to profiles"
  on public.profiles for all
  using (
    (select role from public.profiles where id = auth.uid()::text) = 'admin'
  );
