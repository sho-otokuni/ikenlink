-- 質問を投稿する人が自分で作れるようにする（自由入力・選択式（1つ選ぶ）・選択式（複数選べる））
-- Supabase の SQL Editor に貼り付けて、1回だけ実行する。
-- 実行してから、アプリを新しい版にする（新しい版は single・multi の質問を作るので、先に決まりを広げておく）
--
-- 質問は [{ id, kind, text?, choices? }]
--   free   … 自由入力。text が質問文
--   single … 選択式（1つ選ぶ）。text が質問文、choices が選択肢
--   multi  … 選択式（複数選べる）。答えは選んだ選択肢を改行でつないだ1つの文字にする
--   impression・good・confused・would_use・price・first_look … 前の版の決まった質問（前に作った募集のために残す）
-- 選択肢は 2〜6個、1つ20文字まで、同じものは不可。質問文は60文字まで。質問は全部で8つまで（アプリでは5つまで）

create or replace function public.valid_questions(p jsonb) returns boolean
language sql immutable as $$
  select jsonb_typeof(p) = 'array'
    and jsonb_array_length(p) between 1 and 8
    and coalesce(bool_and(
      jsonb_typeof(q) = 'object'
      and (q ->> 'id') ~ '^[a-z0-9]{1,8}$'
      and (q ->> 'kind') in ('impression', 'good', 'confused', 'would_use', 'price', 'free', 'first_look', 'single', 'multi')
      and (q ? 'text' = false or char_length(q ->> 'text') <= 60)
      and (q ->> 'kind' not in ('free', 'single', 'multi') or char_length(btrim(coalesce(q ->> 'text', ''))) >= 1)
      and (
        q ->> 'kind' not in ('single', 'multi')
        or (
          jsonb_typeof(q -> 'choices') = 'array'
          and jsonb_array_length(q -> 'choices') between 2 and 6
          and (select bool_and(jsonb_typeof(c) = 'string' and char_length(btrim(c #>> '{}')) between 1 and 20 and position(e'\n' in c #>> '{}') = 0)
               from jsonb_array_elements(q -> 'choices') as c)
          and (select count(distinct c #>> '{}') = count(*) from jsonb_array_elements(q -> 'choices') as c)
        )
      )
    ), false)
  from jsonb_array_elements(p) as q;
$$;

-- 意見の決まり：これまでの決まりに、選択式の答えが選択肢の中にあるかを足す
create or replace function public.limit_responses() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  qs jsonb;
begin
  if (select count(*) from responses where link_id = new.link_id and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'too_many_responses';
  end if;
  select l.questions into qs from links l where l.id = new.link_id;
  if exists (
    select 1 from jsonb_each(new.answers) as a(k, v)
    where jsonb_typeof(v) <> 'string' or char_length(v #>> '{}') > 500
      or not exists (select 1 from jsonb_array_elements(coalesce(qs, '[]'::jsonb)) as q where q ->> 'id' = a.k)
  ) or not exists (select 1 from jsonb_each_text(new.answers) as a(k, v) where btrim(v) <> '') then
    raise exception 'invalid_answers';
  end if;
  -- 選択式は、選んだものがすべて選択肢の中にあること（1つ選ぶ質問は1つだけ）
  if exists (
    select 1
    from jsonb_array_elements(coalesce(qs, '[]'::jsonb)) as q
    join jsonb_each_text(new.answers) as a(k, v) on a.k = q ->> 'id'
    where q ->> 'kind' in ('single', 'multi') and btrim(a.v) <> ''
      and (
        (q ->> 'kind' = 'single' and not (q -> 'choices') ? a.v)
        or (q ->> 'kind' = 'multi' and exists (
          select 1 from unnest(string_to_array(a.v, e'\n')) as s where not (q -> 'choices') ? s
        ))
      )
  ) then
    raise exception 'invalid_answers';
  end if;
  return new;
end;
$$;
