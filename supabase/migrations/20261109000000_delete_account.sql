-- アカウントの削除（本人だけ）
-- Supabase の SQL Editor に貼り付けて、1回だけ実行する。
--
-- 利用者を消すと、つながっているものも一緒に消える：
--   作った募集（links）→ 届いた意見（responses）・自分専用 URL の合言葉（link_secrets）
--   引き継ぎの合言葉（link_transfers）
-- ほかの募集に答えた記録は、意見そのものは残し、だれが答えたか（respondent_id）だけを消す
-- 画像の保存場所のファイルは、アプリが先に消してから、この関数を呼ぶ

create function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
