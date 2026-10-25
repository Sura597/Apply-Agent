-- Run in Supabase: SQL Editor > New query > Run
create table public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text default '', email text default '', phone text default '', location text default '',
  years_exp text default '', skills text default '', education text default '', resume_text text default '',
  updated_at timestamptz default now());
create table public.jobs(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text default '', company text default '', url text default '',
  jd text not null check (char_length(jd) between 80 and 20000),
  jd_hash text generated always as (md5(jd)) stored,
  status text not null default 'Job Imported' check (status in ('Job Imported','Analysis Complete','Resume Generated','Awaiting Review','Ready to Apply','Application In Progress','Submitted','Submission Failed','Manual Action Required','Interview','Rejected','Offer','Withdrawn')),
  analysis jsonb, tailored text, changes jsonb, questions jsonb, cover text,
  approved boolean not null default false, created_at timestamptz default now(),
  unique(user_id, jd_hash));
create table public.ai_runs(id bigint generated always as identity primary key, user_id uuid not null references auth.users(id) on delete cascade, created_at timestamptz default now());
create index on public.jobs(user_id, created_at desc);
create index on public.ai_runs(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.ai_runs enable row level security;
create policy "own profile" on public.profiles for all using (auth.uid()=id) with check (auth.uid()=id);
create policy "own jobs" on public.jobs for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "read own runs" on public.ai_runs for select using (auth.uid()=user_id);
create policy "insert own runs" on public.ai_runs for insert with check (auth.uid()=user_id);

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,email) values(new.id,new.email); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
