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
            <h1 className="font-round text-[28px] font-bold leading-snug lg:text-[48px] lg:leading-tight">
              「これ、どう思う？」を、
              <br />
              気軽に。
            </h1>
            <p className="text-sm leading-relaxed text-muted lg:text-[17px] lg:leading-loose">
              思いついたアイデアも、つくりかけのものも。
              <br />
              画像やURLを貼って共有して、感想をもらってみませんか。
              <br />
              答える人は、リンクを開いてそのまま回答できます。
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
// 本物の募集に見えないよう、「使い方の例」と見出しを付け、点線の枠と仮の文字（〇〇さん・画像の枠）で描く
function Sample() {
  return (
    <figure className="m-0 hidden flex-col gap-2.5 lg:flex">
      <figcaption className="flex items-center gap-2 text-[13px] font-bold text-muted">
        <span className="rounded-full bg-peach px-2.5 py-0.5 text-xs text-night">使い方の例</span>
        画像を貼ると、答える人にはこう見えます
      </figcaption>
      <div aria-hidden className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-line bg-card/70 p-5">
        <span className="text-xs text-muted">〇〇さんが意見を募集しています</span>
        <span className="self-start rounded-full bg-coral-tint px-2.5 py-px text-[11px] font-bold">アイデア</span>
        <b className="font-round text-[22px] text-muted">（例）お店のロゴ、どっちがいい？</b>
        <div className="flex gap-2">
          <ImageSlot label="A 案" />
          <ImageSlot label="B 案" />
        </div>
        <b className="text-sm text-muted">パッと見て、どう思いましたか？</b>
        <div className="flex min-h-11 items-center rounded-xl border border-line px-3 text-sm text-muted">ここに感想を書いてもらえます</div>
        <div className="flex gap-2 text-[13px] font-bold text-muted">
          <span className="flex min-h-10 items-center rounded-full border border-line px-3.5">ほしい</span>
          <span className="flex min-h-10 items-center rounded-full border border-line px-3.5">たぶん</span>
          <span className="flex min-h-10 items-center rounded-full border border-line px-3.5">いらないかな</span>
        </div>
      </div>
    </figure>
  );
}

/** 画像が入る場所（線画の山と太陽のマーク） */
function ImageSlot({ label }: { label: string }) {
  return (
    <div className="flex h-[130px] flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-line bg-bg text-xs font-bold text-muted">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <circle cx="9" cy="10" r="1.6" />
        <path d="M3 17l5-5 4 4 3-3 6 6" />
      </svg>
      {label}
    </div>
  );
}
