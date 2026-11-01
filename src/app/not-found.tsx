import Link from "next/link";

/** 見つからないページ（消されたリンク・URL の打ち間違いなど） */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pt-16">
      <h1 className="font-round text-2xl font-bold">ページが見つかりませんでした</h1>
      <p className="text-sm leading-relaxed text-muted">リンクが消されたか、URL が違うのかもしれません。</p>
      <Link href="/" className="font-bold text-coral">
        意見リンクのトップへ
      </Link>
    </main>
  );
}
