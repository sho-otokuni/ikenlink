-- 意見募集中の一覧：作った人が「載せる」を選んだリンクを、だれでも見られる一覧に並べる
-- Supabase の SQL Editor に貼り付けて、1回だけ実行する。

-- 一覧に載せるか（作った人が選ぶ。直すときは「作った人がリンクを直せる」の権限でできる）
alter table public.links add column is_public boolean not null default false;
create index links_public on public.links (created_at desc) where is_public;

-- 見本のリンクは載せておく
update public.links set is_public = true where id = 'demo';

-- 一覧（新しい順）。届いた意見の中身は出さず、数だけ出す
create function public.public_links(p_limit int default 60)
returns table (id text, title text, maker_name text, question_count int, response_count bigint, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select l.id, l.title, l.maker_name, jsonb_array_length(l.questions), count(r.id), l.created_at
  from links l left join responses r on r.link_id = l.id
  where l.is_public
  group by l.id
  order by l.created_at desc
  limit least(greatest(p_limit, 1), 100);
$$;
revoke all on function public.public_links(int) from public;
grant execute on function public.public_links(int) to anon, authenticated;
