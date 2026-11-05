-- 画像それぞれに、タイトルを付けられるようにする（なくてもよい。「これはこの画面です」と説明するため）
-- Supabase の SQL Editor に貼り付けて、1回だけ実行する。
-- 実行してから、アプリを新しい版にする（新しい版は image_captions を読み書きするので、先に列がないと動かない）
--
-- image_captions は images と同じ並び。タイトルがない画像は空の文字（''）にする

-- どれも 40 文字まで（表の決まりの中では、配列の中身を直接は確かめられないため関数にする）
create function public.valid_captions(p text[]) returns boolean
language sql immutable as $$
  select coalesce(bool_and(char_length(c) <= 40), true) from unnest(p) as c;
$$;

alter table public.links add column image_captions text[] not null default '{}'
  check (cardinality(image_captions) <= 4 and public.valid_captions(image_captions));

-- 作る人が書ける列に足す
grant insert (image_captions) on public.links to authenticated;
grant update (image_captions) on public.links to authenticated;

-- 答える画面・画像カード用の読み出しにも足す
create or replace function public.get_link(p_id text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', l.id, 'kind', l.kind, 'title', l.title, 'tagline', l.tagline, 'url', l.url, 'urls', l.urls,
    'images', l.images, 'image_captions', l.image_captions, 'questions', l.questions, 'maker_name', l.maker_name,
    'created_at', l.created_at, 'closes_at', l.closes_at
  )
  from links l where l.id = p_id;
$$;

-- 自分専用の URL で開いたときも返す
create or replace function public.results_by_token(p_link text, p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'link', jsonb_build_object(
      'id', l.id, 'title', l.title, 'tagline', l.tagline, 'url', l.url, 'urls', l.urls, 'images', l.images,
      'image_captions', l.image_captions,
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
