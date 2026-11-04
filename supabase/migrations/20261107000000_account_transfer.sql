-- アカウント登録・ログイン：登録なしで作った募集を、ログインしたアカウントへ移す
-- Supabase の SQL Editor に貼り付けて、1回だけ実行する。
--
-- ふつうは「登録なしの人がそのまま登録する」（Supabase の identity の追加）ので、移す必要はない。
-- 移すのは、別の端末ですでに登録したアカウントへ、この端末からログインし直すときだけ：
--   1. ログインする前（登録なしのまま）に create_transfer() で合言葉をもらう
--   2. ログインしたあとで claim_transfer(合言葉) を呼ぶと、募集と答えた記録が移る
-- 合言葉は1時間で使えなくなり、1回使うと消える

create table public.link_transfers (
  token text primary key,
  from_uid uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
-- 中身は下の2つの関数からだけ読み書きする
alter table public.link_transfers enable row level security;

-- 登録なしの人だけが呼べる。合言葉を返す
create function public.create_transfer() returns text
language plpgsql security definer set search_path = public as $$
declare
  t text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
begin
  if auth.uid() is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false then
    raise exception 'not_anonymous';
  end if;
  delete from link_transfers where from_uid = auth.uid() or created_at < now() - interval '1 hour';
  insert into link_transfers (token, from_uid) values (t, auth.uid());
  return t;
end;
$$;
revoke all on function public.create_transfer() from public, anon;
grant execute on function public.create_transfer() to authenticated;

-- 登録したアカウントで呼ぶ。移した募集の数を返す（合言葉が違う・古いときは 0）
create function public.claim_transfer(p_token text) returns int
language plpgsql security definer set search_path = public as $$
declare
  src uuid;
  moved int;
begin
  if auth.uid() is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'not_member';
  end if;
  delete from link_transfers
    where token = p_token and created_at > now() - interval '1 hour'
    returning from_uid into src;
  if src is null or src = auth.uid() then
    return 0;
  end if;
  update links set owner_id = auth.uid() where owner_id = src;
  get diagnostics moved = row_count;
  update responses set respondent_id = auth.uid() where respondent_id = src;
  return moved;
end;
$$;
revoke all on function public.claim_transfer(text) from public, anon;
grant execute on function public.claim_transfer(text) to authenticated;
