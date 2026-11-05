import Link from "next/link";

import { Header, PAGE_WIDTH } from "@/components/Header";
import { RecentLinks } from "@/components/RecentLinks";

/** はじめの画面。パソコンの幅では、右に答える画面の見本、下に募集中のものを出す */
export default function Home() {
  return (
    <>
      <Header />
      <main className={`${PAGE_WIDTH} flex flex-1 flex-col gap-4 px-3 pb-12 pt-3 lg:gap-8 lg:px-8 xl:px-12 lg:pt-10`}>
        {/* パソコンでは、左に見出し・説明・ボタン、右に「使い方の例」を並べる */}
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_460px] lg:items-center lg:gap-10 xl:grid-cols-[1fr_540px]">
          <section className="flex flex-col gap-3 lg:gap-4">
            <h1 className="font-round text-[28px] font-bold leading-snug lg:text-[56px] lg:leading-tight">
              「これ、どう思う？」
              <br />
              を気軽に。
            </h1>
            <p className="text-sm leading-relaxed text-muted lg:text-[17px] lg:leading-loose">
              思いついたアイデアも、つくりかけのものも。
              <br />
              画像やURLを貼って共有して、意見をもらってみませんか。
              <br />
              答える人は、リンクを開いてそのまま回答できます。
            </p>
            <div className="flex flex-col gap-2 sm:flex-row lg:gap-3">
              <Link href="/new" className="flex min-h-12 items-center justify-center rounded-lg bg-coral px-6 font-bold text-night sm:flex-1 lg:min-h-13 lg:flex-none lg:px-7">
                意見を募集する（無料）
              </Link>
              <Link href="/list" className="flex min-h-12 items-center justify-center rounded-lg border border-line bg-card px-6 font-bold sm:flex-1 lg:min-h-13 lg:flex-none lg:px-7">
                みんなの募集に答える
              </Link>
            </div>
          </section>
          <Sample />
        </div>


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
        募集をすると、答える人にはこう見えます
      </figcaption>
      <div aria-hidden className="flex flex-col gap-3 rounded-lg border-2 border-dashed border-line bg-card/70 p-4">
        <span className="text-xs text-muted">〇〇さんが意見を募集しています</span>
        <span className="self-start rounded-full bg-coral-tint px-2.5 py-px text-[11px] font-bold">アイデア</span>
        <b className="font-round text-[22px] text-muted">（例）お店のロゴ、どっちがいい？</b>
        <div className="flex gap-2">
          <ImageSlot label="A 案" />
          <ImageSlot label="B 案" />
        </div>
        <b className="text-sm text-muted">パッと見て、どう思いましたか？</b>
        <div className="flex min-h-11 items-center rounded-lg border border-line px-3 text-sm text-muted">ここに感想を書いてもらえます</div>
        <div className="flex gap-2 text-[13px] font-bold text-muted">
          <span className="flex min-h-10 items-center rounded-lg border border-line px-3.5">ほしい</span>
          <span className="flex min-h-10 items-center rounded-lg border border-line px-3.5">たぶん</span>
          <span className="flex min-h-10 items-center rounded-lg border border-line px-3.5">いらないかな</span>
        </div>
      </div>
    </figure>
  );
}

/** 画像が入る場所（線画の山と太陽のマーク） */
function ImageSlot({ label }: { label: string }) {
  return (
    <div className="flex h-[130px] flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-line bg-bg text-xs font-bold text-muted">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <circle cx="9" cy="10" r="1.6" />
        <path d="M3 17l5-5 4 4 3-3 6 6" />
      </svg>
      {label}
    </div>
  );
}
