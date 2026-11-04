import Link from "next/link";

import { Header, PAGE_WIDTH } from "@/components/Header";
import { RecentLinks } from "@/components/RecentLinks";

const EXAMPLES = ["新しいアプリの画面", "お店のロゴ案", "考え中のアイデア", "イベントのチラシ", "ブログの下書き"];

const STEPS = [
  { title: "見てほしいものを貼る", body: "画像だけでも、URL でも。聞きたいことを選ぶ" },
  { title: "リンクを送る・公開する", body: "X や LINE で送るか、一覧に公開してだれでも答えられるように" },
  { title: "意見が届く", body: "第一印象、いいところ、気になるところ" },
];

/** はじめの画面。パソコンの幅では、右に答える画面の見本、下に募集中のものを出す */
export default function Home() {
  return (
    <>
      <Header />
      <main className={`${PAGE_WIDTH} flex flex-1 flex-col gap-[18px] px-3 pb-16 pt-4 lg:gap-10 lg:px-0 lg:pt-14`}>
        <div className="flex flex-col gap-[18px] lg:grid lg:grid-cols-[1fr_460px] lg:items-center lg:gap-14">
          <section className="flex flex-col gap-3 lg:gap-5">
            <h1 className="font-round text-[32px] font-bold leading-snug lg:text-[56px] lg:leading-tight">
              「どう思う？」を、
              <br />
              気軽に聞ける。
            </h1>
            <p className="text-sm leading-relaxed text-muted lg:text-[17px] lg:leading-loose">
              アイデア、デザイン、作ったもの、文章。画像や URL を貼るだけで、意見が集まるリンクができます。答える人は登録なし、30秒。
            </p>
            <div className="flex flex-col gap-2 sm:flex-row lg:gap-3">
              <Link href="/new" className="flex min-h-12 items-center justify-center rounded-full bg-coral px-6 font-bold text-night sm:flex-1 lg:min-h-13 lg:flex-none lg:px-7">
                意見を募集する（無料）
              </Link>
              <Link href="/list" className="flex min-h-12 items-center justify-center rounded-full border border-line bg-card px-6 font-bold sm:flex-1 lg:min-h-13 lg:flex-none lg:px-7">
                みんなの募集に答える
              </Link>
            </div>
            <ul className="flex flex-wrap gap-1.5 lg:gap-2" aria-label="使いみちの例">
              {EXAMPLES.map((e) => (
                <li key={e} className="rounded-full border border-line bg-card px-2.5 py-1 text-xs lg:px-3 lg:text-[13px]">
                  {e}
                </li>
              ))}
            </ul>
          </section>
          <Sample />
        </div>

        <ol className="flex flex-col gap-2 lg:grid lg:grid-cols-3 lg:gap-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3 rounded-2xl border border-line bg-card px-3 py-2.5 lg:gap-3.5 lg:p-[18px]">
              <span className="font-round flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-peach font-bold text-night lg:h-10 lg:w-10 lg:text-lg">{i + 1}</span>
              <span className="flex flex-col gap-0.5 lg:gap-1">
                <b className="text-sm lg:text-base">{s.title}</b>
                <span className="text-xs leading-relaxed text-muted lg:text-[13px]">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>

        <RecentLinks />
      </main>
    </>
  );
}

/** 答える画面の見本（パソコンの幅だけ。絵として見せるもので、押せない） */
function Sample() {
  return (
    <div aria-hidden className="hidden flex-col gap-3 rounded-2xl border border-line bg-card p-5 shadow-[0_12px_32px_rgba(28,24,56,0.08)] lg:flex">
      <span className="text-xs text-muted">きのとさんが意見を募集しています · 11月11日まで</span>
      <span className="self-start rounded-full bg-coral-tint px-2.5 py-px text-[11px] font-bold">アイデア</span>
      <b className="font-round text-[22px]">週末だけの古本カフェ、どう思う？</b>
      <div className="flex gap-2">
        <div className="h-[150px] flex-1 rounded-xl bg-grape-tint" />
        <div className="h-[150px] w-[90px] rounded-xl bg-peach-tint" />
      </div>
      <b className="text-sm">パッと見て、どう思いましたか？</b>
      <div className="flex min-h-11 items-center rounded-xl border border-line px-3 text-[15px] text-muted">行ってみたい！雰囲気がよさそう</div>
      <div className="flex gap-2 text-[13px] font-bold">
        <span className="flex min-h-10 items-center rounded-full bg-coral px-3.5">ほしい</span>
        <span className="flex min-h-10 items-center rounded-full border border-line px-3.5">たぶん</span>
        <span className="flex min-h-10 items-center rounded-full border border-line px-3.5">いらないかな</span>
      </div>
    </div>
  );
}
