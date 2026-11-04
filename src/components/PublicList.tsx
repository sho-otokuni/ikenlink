"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SearchIcon } from "@/components/icons";
import { KindLabel } from "@/components/KindLabel";
import { answeredIds } from "@/lib/answered";
import { fetchPublicLinks, type PublicLink } from "@/lib/links";
import { LINK_KINDS, remaining } from "@/lib/questions";
import type { LinkKind } from "@/lib/types";

type Sort = "new" | "many" | "few";
const SORTS: { id: Sort; label: string }[] = [
  { id: "new", label: "新しい順" },
  { id: "many", label: "意見が多い順" },
  { id: "few", label: "意見が少ない順" },
];

/** 「よく答えている人」の印を付ける、ほかの募集に答えた数 */
const ACTIVE_ANSWERER = 3;

/** 意見募集中の一覧。キーワードと種類で絞り込み、まだ答えていないものを先に並べる */
export function PublicList() {
  const [links, setLinks] = useState<PublicLink[] | null>(null);
  const [answered, setAnswered] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<LinkKind | "all">("all");
  const [sort, setSort] = useState<Sort>("new");

  useEffect(() => {
    let alive = true;
    fetchPublicLinks().then((r) => {
      if (!alive) return;
      if (!r.ok) return setError(r.message);
      setAnswered(answeredIds());
      setLinks(r.data);
    });
    return () => {
      alive = false;
    };
  }, []);

  const shown = useMemo(() => {
    if (!links) return [];
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const done = new Set(answered);
    const hits = links
      .filter((l) => kind === "all" || l.kind === kind)
      .filter((l) => words.every((w) => `${l.title} ${l.makerName}`.toLowerCase().includes(w)));
    const order = (a: PublicLink, b: PublicLink) =>
      sort === "few"
        ? a.responseCount - b.responseCount || b.createdAt.localeCompare(a.createdAt)
        : sort === "many"
          ? b.responseCount - a.responseCount || b.createdAt.localeCompare(a.createdAt)
          : b.createdAt.localeCompare(a.createdAt);
    // 答えたものは、どの並びでも下へ
    return [...hits.filter((l) => !done.has(l.id)).sort(order), ...hits.filter((l) => done.has(l.id)).sort(order)];
  }, [links, answered, query, kind, sort]);

  if (error) return <p role="alert" className="text-sm font-bold text-coral">{error}</p>;

  const done = new Set(answered);
  // スマホでは上から「見出し・検索・種類・並べ替え・一覧」と1列に、パソコンでは左の列に見出しと種類、右に検索と一覧を置く。
  // スマホでは左右の入れ物（contents）を消して、order で並びを決める
  return (
    <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-[240px_1fr] lg:items-start lg:gap-8">
      <aside className="contents lg:flex lg:flex-col lg:gap-5">
        <div className="flex flex-col gap-1 lg:gap-1.5">
          <h1 className="font-round text-[22px] font-bold lg:text-[28px]">意見募集中</h1>
          <p className="text-xs leading-relaxed text-muted lg:text-[13px]">
            公開されている募集です。どれも登録なし、30秒ほどで答えられます。
          </p>
        </div>
        <div role="tablist" aria-label="種類" className="order-2 -mx-3 flex gap-1.5 overflow-x-auto px-3 lg:order-none lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
          <span className="hidden text-xs font-bold text-muted lg:block">種類</span>
          {[{ kind: "all" as const, label: "すべて" }, ...LINK_KINDS].map((k) => (
            <button
              key={k.kind}
              type="button"
              role="tab"
              aria-selected={kind === k.kind}
              onClick={() => setKind(k.kind)}
              className={`min-h-11 shrink-0 rounded-full border px-3 text-xs font-bold lg:min-h-10 lg:rounded-[10px] lg:border-0 lg:text-left lg:text-sm ${
                kind === k.kind ? "border-night bg-night text-white" : "border-line bg-card lg:bg-transparent lg:hover:bg-card"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <Link href="/new" className="hidden flex-col gap-2 rounded-2xl border border-peach bg-peach-tint p-3.5 lg:flex">
          <b className="text-sm">自分も意見を募集する</b>
          <span className="text-xs leading-relaxed">画像1枚からでも、意見を集められます。</span>
          <span className="flex min-h-10 items-center justify-center rounded-full bg-coral text-sm font-bold text-night">＋ 募集する</span>
        </Link>
      </aside>

      <section className="contents lg:flex lg:flex-col lg:gap-4">
        <div className="contents lg:flex lg:items-center lg:gap-3">
          <label role="search" className="order-1 flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-3 text-muted focus-within:border-coral lg:order-none lg:min-h-12 lg:flex-1 lg:px-4">
            <SearchIcon />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="募集を検索"
              placeholder="キーワードで探す（例：カフェ、ロゴ）"
              className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none"
            />
          </label>
          <label className="order-3 flex min-h-11 items-center justify-end gap-2 text-xs text-muted lg:order-none lg:text-[13px]">
            <span className="sr-only lg:not-sr-only">並べ替え</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="min-h-11 bg-transparent text-right text-xs font-bold text-ink outline-none lg:rounded-[10px] lg:border lg:border-line lg:bg-card lg:px-2.5 lg:text-left lg:text-[13px]"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="order-4 flex flex-col gap-2 lg:order-none">
          {!links && <div className="h-40 rounded-2xl bg-line" aria-busy />}
          {links?.length === 0 && <p className="text-sm text-muted">いまは意見を募集しているものがありません。</p>}
          {links && links.length > 0 && shown.length === 0 && <p className="text-sm text-muted">見つかりませんでした。ことばや種類を変えてみてください。</p>}
          {/* パソコンでは画面の幅に合わせて 3〜5 列 */}
          <ul className="flex flex-col gap-2 lg:grid lg:grid-cols-3 lg:gap-4 xl:grid-cols-4 2xl:grid-cols-5">
            {shown.map((l) => (
              <li key={l.id} className="flex">
                <LinkCard link={l} done={done.has(l.id)} />
              </li>
            ))}
          </ul>
          <Link href="/new" className="flex min-h-11 items-center justify-center rounded-full border border-dashed border-line text-[13px] font-bold lg:hidden">
            ＋ 自分も意見を募集する
          </Link>
        </div>
      </section>
    </div>
  );
}

/** 募集1件のカード。スマホでは横長（画像が左）、パソコンでは縦長（画像が上） */
export function LinkCard({ link: l, done }: { link: PublicLink; done: boolean }) {
  const left = remaining(l.closesAt);
  return (
    <Link
      href={`/l/${l.id}`}
      className={`flex w-full items-center gap-2.5 rounded-2xl border border-line p-2 hover:border-coral lg:flex-col lg:items-stretch lg:gap-0 lg:overflow-hidden lg:p-0 ${done ? "bg-bg opacity-70" : "bg-card"}`}
    >
      <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-grape-tint lg:h-[150px] lg:w-full lg:rounded-none">
        {l.image ? (
          <Image src={l.image} alt="" fill sizes="(min-width: 1024px) 360px, 64px" className="object-cover" />
        ) : (
          <span className="font-round text-xl font-bold text-muted lg:text-4xl">{l.title.slice(0, 1)}</span>
        )}
      </span>
      {/* パソコンでは列が細くなるので、「答える」は説明の下の右端に置く */}
      <span className="flex flex-1 items-center gap-2.5 lg:flex-col lg:items-stretch lg:gap-2 lg:px-3.5 lg:pb-3.5 lg:pt-3">
        <span className="flex flex-1 flex-col items-start gap-1 lg:gap-1.5">
          <span className="flex flex-wrap gap-1">
            <KindLabel link={l} small />
            {l.ownerAnswered >= ACTIVE_ANSWERER && <span className="rounded-full bg-leaf-tint px-2 py-px text-[10px] font-bold text-leaf-dark">よく答えている人</span>}
          </span>
          <span className="text-sm font-bold leading-snug lg:text-[15px]">{l.title}</span>
          <span className="text-[11px] text-muted lg:text-xs">
            {l.makerName}さん · {/* 0件の寂しさを、答える理由に変える */}
            {l.responseCount > 0 ? `意見 ${l.responseCount}件` : <b className="text-coral">最初の意見を送ろう</b>}
            {left && (left === "今日まで" ? <b className="text-coral"> · 今日まで</b> : ` · ${left}`)}
          </span>
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-1.5 text-xs font-bold lg:self-end ${done ? "bg-leaf-tint" : "bg-coral text-night"}`}>{done ? "答えた" : "答える"}</span>
      </span>
    </Link>
  );
}
