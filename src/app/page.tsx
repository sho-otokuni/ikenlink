import Link from "next/link";

import { AuthLinks } from "@/components/AuthLinks";
import { Header, PAGE_WIDTH } from "@/components/Header";
import { LogoMark } from "@/components/Logo";
import { RecentLinks } from "@/components/RecentLinks";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

/** はじめの画面。パソコンの幅では、右に答える画面の見本、下に募集中のものを出す */
/** 検索エンジン向けの構造化データ（このサイトが何のサービスか） */
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", name: SITE_NAME, url: SITE_URL, inLanguage: "ja" },
    {
      "@type": "WebApplication",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "ja",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }} />
      <Header />
      <main className={`${PAGE_WIDTH} flex flex-1 flex-col gap-4 px-3 pb-12 pt-3 lg:gap-8 lg:px-8 xl:px-12 lg:pt-10`}>
        {/* パソコンでは、左に見出し・説明・ボタン、右に「使い方の例」を並べる */}
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_460px] lg:items-center lg:gap-10 xl:grid-cols-[1fr_540px]">
          {/*
            スマホでは X や Instagram のはじめの画面のように、ロゴ・見出し・ボタンを画面の真ん中にそろえて縦に並べる。
            パソコンでは左寄せのまま
          */}
          <section className="flex min-h-[calc(100dvh-7rem)] flex-col items-center justify-center gap-4 text-center lg:min-h-0 lg:items-stretch lg:justify-start lg:gap-4 lg:text-left">
            <span className="lg:hidden">
              <LogoMark size={64} />
            </span>
            <h1 className="font-round text-[28px] font-bold leading-snug lg:text-[56px] lg:leading-tight">
              「これ、どう思う？」
              <br />
              を気軽に。
            </h1>
            <p className="text-[13px] leading-relaxed text-muted sm:text-sm lg:text-[17px] lg:leading-loose">
              思いついたアイデアも、つくりかけのものも。
              <br />
              画像やURLを貼って共有して、意見をもらってみませんか。
              <br />
              答える人は、リンクを開いてそのまま回答できます。
            </p>
            <div className="mt-2 flex w-full max-w-sm flex-col gap-2.5 lg:mt-0 lg:max-w-none lg:flex-row lg:gap-3">
              <Link href="/new" className="flex min-h-12 items-center justify-center rounded-lg bg-coral px-6 font-bold text-night lg:min-h-13 lg:px-7">
                意見を募集する（無料）
              </Link>
              <Link href="/list" className="flex min-h-12 items-center justify-center rounded-lg border border-line bg-card px-6 font-bold lg:min-h-13 lg:px-7">
                みんなの募集に答える
              </Link>
            </div>
            <AuthLinks />
          </section>
          <Sample />
        </div>


        <RecentLinks />
      </main>
    </>
  );
}

/** 答える画面の見本（パソコンの幅だけ。絵として見せるもので、押せない） */
// 本物の募集に見えないよう、点線の枠と仮の文字（〇〇さん・画像の枠・（例））で描く
function Sample() {
  return (
    <figure className="m-0 hidden flex-col gap-2.5 lg:flex">
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
