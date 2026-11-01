-- 意見リンク：はじめの表と権限
-- Supabase の SQL Editor に貼り付けて、1回だけ実行する。
--
-- 作る人：登録なしで始められるよう、Supabase の「匿名ログイン」を使う（あとでメールにつなげられる）
-- 答える人：ログインなしで、意見を送れる
-- 届いた意見：作った人だけが読める

-- ============================================================
-- 1. 意見リンク
-- ============================================================
create table public.links (
  -- URL の最後に付く、短くて推測されにくい文字（例：57jgkrda。見本の demo だけ4文字）
  id text primary key check (id ~ '^[a-z0-9]{4,16}$'),
  owner_id uuid references auth.users (id) on delete cascade default auth.uid(),
  title text not null check (char_length(btrim(title)) between 1 and 40),
  tagline text check (tagline is null or char_length(tagline) <= 60),
  url text check (url is null or (char_length(url) <= 500 and url ~ '^https?://')),
  -- 画面の写真の URL（3枚まで。保存場所「link-images」に置いたもの）
  images text[] not null default '{}' check (cardinality(images) <= 3),
  -- 聞きたいこと（[{ id, kind, text? }] の形。8つまで）
  questions jsonb not null check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) between 1 and 8),
  maker_name text not null check (char_length(btrim(maker_name)) between 1 and 20),
  created_at timestamptz not null default now()
);
create index links_owner on public.links (owner_id, created_at desc);

alter table public.links enable row level security;
-- リンクを知っている人なら、だれでも答える画面を開ける
create policy "リンクはだれでも見られる" on public.links for select using (true);
create policy "ログインした人がリンクを作れる" on public.links for insert to authenticated with check (owner_id = auth.uid());
create policy "作った人がリンクを直せる" on public.links for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "作った人がリンクを消せる" on public.links for delete to authenticated using (owner_id = auth.uid());

-- ============================================================
-- 2. 届いた意見
-- ============================================================
create table public.responses (
  id uuid primary key default gen_random_uuid(),
  link_id text not null references public.links (id) on delete cascade,
  -- 質問の id → 答え（文字）
  answers jsonb not null check (jsonb_typeof(answers) = 'object' and pg_column_size(answers) <= 8000),
  created_at timestamptz not null default now()
);
create index responses_link on public.responses (link_id, created_at desc);

alter table public.responses enable row level security;
-- 答える人はログインなしで送れる（だれが送ったかは残さない）
create policy "だれでも意見を送れる" on public.responses for insert to anon, authenticated
  with check (exists (select 1 from public.links l where l.id = link_id));
-- 読めるのは、そのリンクを作った人だけ
create policy "作った人だけが意見を読める" on public.responses for select to authenticated
  using (exists (select 1 from public.links l where l.id = link_id and l.owner_id = auth.uid()));

-- 荒らし対策：同じリンクへの意見は、1分間に30件まで
create function public.limit_responses() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from responses where link_id = new.link_id and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'too_many_responses';
  end if;
  return new;
end;
$$;
create trigger responses_limit before insert on public.responses
  for each row execute function public.limit_responses();

-- 一覧で使う：自分のリンクごとの意見の数と、最後に届いた日時
create function public.my_link_stats() returns table (link_id text, response_count bigint, last_response_at timestamptz)
language sql stable security definer set search_path = public as $$
  select l.id, count(r.id), max(r.created_at)
  from links l left join responses r on r.link_id = l.id
  where l.owner_id = auth.uid()
  group by l.id;
$$;
revoke all on function public.my_link_stats() from public, anon;
grant execute on function public.my_link_stats() to authenticated;

-- ============================================================
-- 3. 画面の写真の保存場所（だれでも見られる。置けるのは自分のフォルダだけ）
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('link-images', 'link-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']);

create policy "自分のフォルダに写真を置ける" on storage.objects for insert to authenticated
  with check (bucket_id = 'link-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "自分の写真を消せる" on storage.objects for delete to authenticated
  using (bucket_id = 'link-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- 4. 見本のリンク（/l/demo で答える画面を試せる。作った人はいない）
-- ============================================================
insert into public.links (id, owner_id, title, tagline, url, images, questions, maker_name)
values (
  'demo', null, 'DreamBeaver', '思いつきを置いて、仲間と形にするアプリ', 'https://example.com',
  array['https://picsum.photos/seed/ikenlink-demo1/750/1334', 'https://picsum.photos/seed/ikenlink-demo2/750/1334'],
  '[{"id":"q1","kind":"first_look"},{"id":"q2","kind":"would_use"},{"id":"q3","kind":"confused"},{"id":"q4","kind":"price"},{"id":"q5","kind":"free","text":"名前の印象はどうですか？"}]',
  'きのと'
);
