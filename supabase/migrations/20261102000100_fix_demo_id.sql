-- 見本のリンク（id が demo の4文字）が、id の決まり（6文字以上）に引っかかって入らなかったのを直す。
-- 20261102000000_init.sql を実行して「links_id_check」のエラーが出たときだけ、これを1回実行する。
alter table public.links drop constraint links_id_check;
alter table public.links add constraint links_id_check check (id ~ '^[a-z0-9]{4,16}$');

insert into public.links (id, owner_id, title, tagline, url, images, questions, maker_name)
values (
  'demo', null, 'DreamBeaver', '思いつきを置いて、仲間と形にするアプリ', 'https://example.com',
  array['https://picsum.photos/seed/ikenlink-demo1/750/1334', 'https://picsum.photos/seed/ikenlink-demo2/750/1334'],
  '[{"id":"q1","kind":"first_look"},{"id":"q2","kind":"would_use"},{"id":"q3","kind":"confused"},{"id":"q4","kind":"price"},{"id":"q5","kind":"free","text":"名前の印象はどうですか？"}]',
  'きのと'
)
on conflict (id) do nothing;
