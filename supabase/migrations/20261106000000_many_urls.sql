-- 募集に URL をいくつも付けられるようにする（5つまで）
-- Supabase の SQL Editor に貼り付けて、1回だけ実行する。
--
-- これまでの url（1つ）は残し、新しい urls に移す。アプリは urls を使う

-- どれも https:// か http:// で始まり、500文字まで（表の決まりの中では、配列の中身を直接は確かめられないため関数にする）
create function public.valid_urls(p text[]) returns boolean
language sql immutable as $$
  select coalesce(bool_and(u ~ '^https?://' and char_length(u) <= 500), true) from unnest(p) as u;
$$;

alter table public.links add column urls text[] not null default '{}'
  check (cardinality(urls) <= 5 and public.valid_urls(urls));
update public.links set urls = array[url] where url is not null;

-- 自分専用の URL で開いたときも、urls を返す
create or replace function public.results_by_token(p_link text, p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'link', jsonb_build_object(
      'id', l.id, 'title', l.title, 'tagline', l.tagline, 'url', l.url, 'urls', l.urls, 'images', l.images,
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
