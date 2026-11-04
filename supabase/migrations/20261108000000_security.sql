-- セキュリティの見直し（攻撃テストで見つかった問題を直す）
-- Supabase の SQL Editor に貼り付けて、1回だけ実行する。
-- 実行したら、アプリを新しい版にする（getLink を get_link 経由に変えた版。古い版のままだと答える画面が開けない）
--
--  1. 「リンクを知っている人だけ」の募集を、だれでも一覧できてしまう → 表を直接読めるのは持ち主だけにし、
--     答える画面は id を知っている人だけが1件ずつ読める関数（get_link）から読む。募集した人の id（owner_id）も出さない
--  2. 作った日時（created_at）を自分で書けてしまう（未来にして一覧の上に居座る・意見の連投制限をかわす）
--     → 書ける列を決めて、日時や持ち主はデータベースが決める
--  3. 画像に外のサイトの URL を入れられる（答える人の IP を集められる）→ 意見リンクの保存場所の画像だけにする
--  4. 質問の文・意見の答えの長さや形を確かめていない → 決まりを足す
--  5. 募集をいくらでも作れる → 1時間に20件まで
--  6. 自分のフォルダの画像を一覧できず、募集を消しても画像が残る → 自分のフォルダだけ一覧できるようにする

-- ============================================================
-- 1. 募集の表を読めるのは持ち主だけ
-- ============================================================
drop policy "リンクはだれでも見られる" on public.links;
create policy "作った人だけがリンクの表を読める" on public.links for select to authenticated using (owner_id = auth.uid());

-- 答える画面・画像カード用：id を知っていれば1件読める（持ち主の id は出さない）
create function public.get_link(p_id text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', l.id, 'kind', l.kind, 'title', l.title, 'tagline', l.tagline, 'url', l.url, 'urls', l.urls,
    'images', l.images, 'questions', l.questions, 'maker_name', l.maker_name,
    'created_at', l.created_at, 'closes_at', l.closes_at
  )
  from links l where l.id = p_id;
$$;
revoke all on function public.get_link(text) from public;
grant execute on function public.get_link(text) to anon, authenticated;

-- 意見を受け付けているか（締め切り前か）。答える人は表を読めないので、関数で確かめる
create function public.link_accepts_responses(p_link text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from links where id = p_link and (closes_at is null or closes_at > now()));
$$;
revoke all on function public.link_accepts_responses(text) from public;
grant execute on function public.link_accepts_responses(text) to anon, authenticated;

drop policy "締め切り前なら、だれでも意見を送れる" on public.responses;
create policy "締め切り前なら、だれでも意見を送れる" on public.responses for insert to anon, authenticated
  with check (respondent_id is not distinct from auth.uid() and public.link_accepts_responses(link_id));

-- ============================================================
-- 2. 書ける列を決める（日時・持ち主・答えた人は、データベースが決める）
-- ============================================================
revoke insert, update on public.links from anon, authenticated;
grant insert (id, kind, title, tagline, url, urls, images, questions, maker_name, closes_at, is_public) on public.links to authenticated;
grant update (kind, title, tagline, url, urls, images, questions, maker_name, closes_at, is_public) on public.links to authenticated;

revoke insert, update on public.responses from anon, authenticated;
grant insert (link_id, answers) on public.responses to anon, authenticated;

-- ============================================================
-- 3・4. 画像・質問の決まり
-- ============================================================
-- 画像は、このプロジェクトの保存場所（link-images）に置いたものだけ。見本（demo）だけは例外
create function public.valid_images(p_id text, p text[]) returns boolean
language sql immutable as $$
  select p_id = 'demo' or coalesce(bool_and(u like 'https://ntlpkbrgipnyjzbvmlqw.supabase.co/storage/v1/object/public/link-images/%'), true)
  from unnest(p) as u;
$$;
alter table public.links add constraint links_images_ours check (public.valid_images(id, images));

-- 質問は [{ id, kind, text? }]。id は短い英数字、kind は決まったもの、自由な質問の文は60文字まで
create function public.valid_questions(p jsonb) returns boolean
language sql immutable as $$
  select coalesce(bool_and(
    jsonb_typeof(q) = 'object'
    and (q ->> 'id') ~ '^[a-z0-9]{1,8}$'
    and (q ->> 'kind') in ('impression', 'good', 'confused', 'would_use', 'price', 'free', 'first_look')
    and (q ? 'text' = false or char_length(q ->> 'text') <= 60)
    and (q ->> 'kind' <> 'free' or char_length(btrim(coalesce(q ->> 'text', ''))) >= 1)
  ), false)
  from jsonb_array_elements(p) as q;
$$;
alter table public.links add constraint links_questions_valid check (public.valid_questions(questions));

-- ============================================================
-- 4. 意見の決まり（連投の制限と一緒に確かめる）
--    答えは、その募集の質問の id だけ。1つの答えは500文字まで。中身が1つもない答えは受け付けない
-- ============================================================
create or replace function public.limit_responses() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  ids text[];
begin
  if (select count(*) from responses where link_id = new.link_id and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'too_many_responses';
  end if;
  select array_agg(q ->> 'id') into ids from links l, jsonb_array_elements(l.questions) as q where l.id = new.link_id;
  if exists (
    select 1 from jsonb_each(new.answers) as a(k, v)
    where not (k = any (coalesce(ids, '{}'))) or jsonb_typeof(v) <> 'string' or char_length(v #>> '{}') > 500
  ) or not exists (select 1 from jsonb_each_text(new.answers) as a(k, v) where btrim(v) <> '') then
    raise exception 'invalid_answers';
  end if;
  return new;
end;
$$;

-- ============================================================
-- 5. 募集は1人1時間に20件まで（荒らし対策）
-- ============================================================
create function public.limit_links() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from links where owner_id = new.owner_id and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'too_many_links';
  end if;
  return new;
end;
$$;
create trigger links_limit before insert on public.links
  for each row execute function public.limit_links();

-- ============================================================
-- 6. 自分のフォルダの画像だけ一覧できる（募集を消すとき、画像も一緒に消すため）
-- ============================================================
create policy "自分の写真を一覧できる" on storage.objects for select to authenticated
  using (bucket_id = 'link-images' and (storage.foldername(name))[1] = auth.uid()::text);
