-- 画面デザインの作り直しに合わせた変更
-- Supabase の SQL Editor に貼り付けて、1回だけ実行する。
--
-- 1. 見てほしいものの種類（アプリ・サービス／アイデア／デザイン／文章／そのほか）
-- 2. 説明を長く書けるように（60文字 → 400文字）。画像は4枚まで。URL はなくてもよい（もともと）
-- 3. 締め切り（過ぎたら答えられず、一覧からも外れる）
-- 4. 答えた数：ほかの募集に答えるほど、自分の募集が一覧で前に出やすくなる
--    だれが答えたかは数えるためだけに残し、募集した人には見せない

-- ============================================================
-- 1〜3. リンクの表
-- ============================================================
alter table public.links add column kind text not null default 'other'
  check (kind in ('app', 'idea', 'design', 'text', 'other'));
alter table public.links add column closes_at timestamptz;

alter table public.links drop constraint links_tagline_check;
alter table public.links add constraint links_tagline_check check (tagline is null or char_length(tagline) <= 400);
alter table public.links drop constraint links_images_check;
alter table public.links add constraint links_images_check check (cardinality(images) <= 4);

update public.links set kind = 'app' where id = 'demo';

-- ============================================================
-- 3〜4. 届いた意見の表
-- ============================================================
-- 答えた人（登録なしの匿名ログイン）。答えた数を数えるためだけに使う
alter table public.responses add column respondent_id uuid references auth.users (id) on delete set null default auth.uid();
create index responses_respondent on public.responses (respondent_id) where respondent_id is not null;

-- 募集した人には、答えた人の id を見せない（読める列を絞る）
revoke select on public.responses from anon, authenticated;
grant select (id, link_id, answers, created_at) on public.responses to authenticated;

-- 送れるのは、締め切り前のリンクだけ。答えた人の欄は自分（ログインなしなら空）にしかできない
drop policy "だれでも意見を送れる" on public.responses;
create policy "締め切り前なら、だれでも意見を送れる" on public.responses for insert to anon, authenticated
  with check (
    respondent_id is not distinct from auth.uid()
    and exists (select 1 from public.links l where l.id = link_id and (l.closes_at is null or l.closes_at > now()))
  );

-- ============================================================
-- 4. 答えた数
-- ============================================================
-- 数えるのは「ほかの人の募集」に「中身のある答え」をしたものだけ。同じ募集に何度答えても1件
create function public.answer_counts() returns table (respondent_id uuid, answered bigint)
language sql stable security definer set search_path = public as $$
  select r.respondent_id, count(distinct r.link_id)
  from responses r join links l on l.id = r.link_id
  where r.respondent_id is not null
    and l.owner_id is distinct from r.respondent_id
    and (select coalesce(sum(char_length(btrim(v))), 0) from jsonb_each_text(r.answers) as a(k, v)) >= 10
  group by r.respondent_id;
$$;
revoke all on function public.answer_counts() from public, anon, authenticated;

-- 自分の答えた数
create function public.my_answer_count() returns bigint
language sql stable security definer set search_path = public as $$
  select coalesce((select answered from answer_counts() where respondent_id = auth.uid()), 0);
$$;
revoke all on function public.my_answer_count() from public, anon;
grant execute on function public.my_answer_count() to authenticated;

-- ============================================================
-- 一覧：締め切ったものは外す。種類・最初の画像・締め切り・募集した人の答えた数も返す
-- ============================================================
drop function public.public_links(int);
create function public.public_links(p_limit int default 100)
returns table (
  id text, title text, kind text, image text, maker_name text,
  response_count bigint, created_at timestamptz, closes_at timestamptz, owner_answered bigint
)
language sql stable security definer set search_path = public as $$
  select l.id, l.title, l.kind, l.images[1], l.maker_name,
    (select count(*) from responses r where r.link_id = l.id),
    l.created_at, l.closes_at, coalesce(a.answered, 0)
  from links l left join answer_counts() a on a.respondent_id = l.owner_id
  where l.is_public and (l.closes_at is null or l.closes_at > now())
  order by l.created_at desc
  limit least(greatest(p_limit, 1), 200);
$$;
revoke all on function public.public_links(int) from public;
grant execute on function public.public_links(int) to anon, authenticated;

-- 自分専用の URL で開いたときも、種類と締め切りを返す
create or replace function public.results_by_token(p_link text, p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'link', jsonb_build_object(
      'id', l.id, 'title', l.title, 'tagline', l.tagline, 'url', l.url, 'images', l.images,
      'questions', l.questions, 'maker_name', l.maker_name, 'created_at', l.created_at,
      'kind', l.kind, 'closes_at', l.closes_at
    ),
    'responses', coalesce((
      select jsonb_agg(jsonb_build_object('id', r.id, 'answers', r.answers, 'created_at', r.created_at) order by r.created_at desc)
      from responses r where r.link_id = l.id
    ), '[]'::jsonb)
  )
  from links l join link_secrets s on s.link_id = l.id
  where l.id = p_link and s.admin_token = p_token;
$$;
