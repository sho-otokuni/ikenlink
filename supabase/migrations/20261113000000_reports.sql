-- 不適切な募集の報告
-- Supabase の SQL Editor に貼り付けて、1回だけ実行する。
-- 実行してから、アプリを新しい版にする（新しい版は答える画面から reports に書き込む）
--
-- 報告は運営者だけが読む（Supabase の管理画面の Table Editor で reports を開く）。
-- 利用者は書き込めるだけで、誰の報告も読めない。
-- 荒らし対策として、1人1時間に10件まで、同じ人が同じ募集を報告できるのは1回まで

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  link_id text not null references public.links (id) on delete cascade,
  reason text not null check (reason in ('inappropriate', 'spam', 'rights', 'personal', 'other')),
  note text check (note is null or char_length(note) <= 500),
  reporter_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (link_id, reporter_id)
);

alter table public.reports enable row level security;

-- 書き込めるのは、自分（いまの利用者）としての報告だけ。読む決まりは作らない（＝誰も読めない）
create policy "自分として報告できる" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());

revoke all on public.reports from anon, authenticated;
grant insert (link_id, reason, note) on public.reports to authenticated;

-- 1人1時間に10件まで
create function public.limit_reports() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from reports where reporter_id = new.reporter_id and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'too_many_reports';
  end if;
  return new;
end;
$$;
create trigger reports_limit before insert on public.reports
  for each row execute function public.limit_reports();
