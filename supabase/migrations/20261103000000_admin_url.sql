-- 管理用の秘密の URL：作ったリンクの意見を、どの端末からでも見られるようにする（登録なし）
-- Supabase の SQL Editor に貼り付けて、1回だけ実行する。
--
-- リンクを作ると、推測できない長い文字（合言葉）が一緒にできる。
-- /me/リンクのid?k=合言葉 を開けば、作った端末でなくても、届いた意見を見られる。
-- 合言葉は、リンクの表とは別の表に置き、作った人にしか見えないようにする（リンクの表はだれでも読めるため）。

create table public.link_secrets (
  link_id text primary key references public.links (id) on delete cascade,
  admin_token text not null check (admin_token ~ '^[A-Za-z0-9]{24,64}$'),
  created_at timestamptz not null default now()
);

alter table public.link_secrets enable row level security;
create policy "作った人が合言葉を置ける" on public.link_secrets for insert to authenticated
  with check (exists (select 1 from public.links l where l.id = link_id and l.owner_id = auth.uid()));
create policy "作った人だけが合言葉を見られる" on public.link_secrets for select to authenticated
  using (exists (select 1 from public.links l where l.id = link_id and l.owner_id = auth.uid()));

-- 合言葉が合っていれば、リンクと届いた意見（新しい順）を返す。合わなければ null
create function public.results_by_token(p_link text, p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'link', jsonb_build_object(
      'id', l.id, 'title', l.title, 'tagline', l.tagline, 'url', l.url, 'images', l.images,
      'questions', l.questions, 'maker_name', l.maker_name, 'created_at', l.created_at
    ),
    'responses', coalesce((
      select jsonb_agg(jsonb_build_object('id', r.id, 'answers', r.answers, 'created_at', r.created_at) order by r.created_at desc)
      from responses r where r.link_id = l.id
    ), '[]'::jsonb)
  )
  from links l join link_secrets s on s.link_id = l.id
  where l.id = p_link and s.admin_token = p_token;
$$;
revoke all on function public.results_by_token(text, text) from public;
grant execute on function public.results_by_token(text, text) to anon, authenticated;
