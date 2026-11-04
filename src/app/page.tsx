import Link from "next/link";

import { Header } from "@/components/Header";

const EXAMPLES = ["新しいアプリの画面", "お店のロゴ案", "考え中のアイデア", "イベントのチラシ", "ブログの下書き"];

const STEPS = [
  { title: "見てほしいものを貼る", body: "画像だけでも、URL でも。聞きたいことを選ぶ" },
  { title: "リンクを送る・公開する", body: "X や LINE で送るか、一覧に公開してだれでも答えられるように" },
  { title: "意見が届く", body: "第一印象、いいところ、気になるところ" },
];

/** はじめの画面 */
export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-[18px] px-3 pb-16 pt-4">
        <section className="flex flex-col gap-3">
          <h1 className="font-round text-[32px] font-bold leading-snug">
            「どう思う？」を、
            <br />
            気軽に聞ける。
          </h1>
          <p className="text-sm leading-relaxed text-muted">アイデア、デザイン、作ったもの、文章。画像や URL を貼るだけで、意見が集まるリンクができます。答える人は登録なし、30秒。</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/new" className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-coral px-6 font-bold text-night">
              意見を募集する（無料）
            </Link>
            <Link href="/list" className="flex min-h-12 flex-1 items-center justify-center rounded-full border border-line px-6 font-bold">
              みんなの募集に答える
            </Link>
          </div>
        </section>

        <ul className="flex flex-wrap gap-1.5" aria-label="使いみちの例">
          {EXAMPLES.map((e) => (
            <li key={e} className="rounded-full border border-line bg-card px-2.5 py-1 text-xs">
              {e}
            </li>
          ))}
        </ul>

        <ol className="flex flex-col gap-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3 rounded-2xl border border-line bg-card px-3 py-2.5">
              <span className="font-round flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-peach font-bold text-night">{i + 1}</span>
              <span className="flex flex-col gap-0.5">
                <b className="text-sm">{s.title}</b>
                <span className="text-xs leading-relaxed text-muted">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}
