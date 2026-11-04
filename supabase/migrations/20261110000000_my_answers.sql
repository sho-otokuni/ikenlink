-- 自分の回答：アカウント登録している人が、これまでに答えた意見を見返せるようにする
-- Supabase の SQL Editor に貼り付けて、1回だけ実行する。
--
-- 届いた意見の表は、募集した人しか読めない。答えた本人が自分の答えを読めるよう、関数で返す。
-- 返すのは本人が答えたものだけ（respondent_id が自分）。募集した人の id は出さない
-- 登録なしの人には返さない（ブラウザを消すと見られなくなるため、画面でも登録をすすめる）

create function public.my_answers(p_limit int default 100)
returns table (
  response_id uuid, answered_at timestamptz, answers jsonb,
  link_id text, title text, kind text, image text, questions jsonb, maker_name text
)
language sql stable security definer set search_path = public as $$
  select r.id, r.created_at, r.answers, l.id, l.title, l.kind, l.images[1], l.questions, l.maker_name
  from responses r join links l on l.id = r.link_id
  where r.respondent_id = auth.uid()
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  order by r.created_at desc
  limit least(greatest(p_limit, 1), 200);
$$;
revoke all on function public.my_answers(int) from public, anon;
grant execute on function public.my_answers(int) to authenticated;
