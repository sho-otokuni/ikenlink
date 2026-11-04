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

type Sort = "recommended" | "new" | "few";
const SORTS: { id: Sort; label: string }[] = [
  { id: "recommended", label: "おすすめ順（よく答えている人が先）" },
  { id: "new", label: "新しい順" },
  { id: "few", label: "意見が少ない順" },
];

/** 「よく答えている人」の印を付ける、ほかの募集に答えた数 */
const ACTIVE_ANSWERER = 3;

/**
 * おすすめ順の点数。ほかの募集に答えた数が多い人ほど前に（20件で頭打ち）。
 * 答えた数だけだと新しく来た人がずっと後ろになるので、始めて2日以内の募集は少し前に出す
 */
function score(l: PublicLink, now: number) {
  const fresh = now - new Date(l.createdAt).getTime() < 2 * 86_400_000 ? 5 : 0;
  return Math.min(l.ownerAnswered, 20) + fresh;
}

/** 意見募集中の一覧。キーワードと種類で絞り込み、まだ答えていないものを先に並べる */
export function PublicList() {
  const [links, setLinks] = useState<PublicLink[] | null>(null);
  // 読み込んだ時刻（おすすめ順の「始めて2日以内」を数える基準）
  const [loadedAt, setLoadedAt] = useState(0);
  const [answered, setAnswered] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<LinkKind | "all">("all");
  const [sort, setSort] = useState<Sort>("recommended");

  useEffect(() => {
    let alive = true;
    fetchPublicLinks().then((r) => {
      if (!alive) return;
      if (!r.ok) return setError(r.message);
      setAnswered(answeredIds());
      setLoadedAt(Date.now());
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
      sort === "new"
        ? b.createdAt.localeCompare(a.createdAt)
        : sort === "few"
          ? a.responseCount - b.responseCount || b.createdAt.localeCompare(a.createdAt)
          : score(b, loadedAt) - score(a, loadedAt) || b.createdAt.localeCompare(a.createdAt);
    // 答えたものは、どの並びでも下へ
    return [...hits.filter((l) => !done.has(l.id)).sort(order), ...hits.filter((l) => done.has(l.id)).sort(order)];
  }, [links, loadedAt, answered, query, kind, sort]);

  if (error) return <p role="alert" className="text-sm font-bold text-coral">{error}</p>;

  const done = new Set(answered);
  return (
    <div className="flex flex-col gap-2.5">
      <label role="search" className="flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-3 text-muted focus-within:border-coral">
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
      <div role="tablist" aria-label="種類" className="-mx-3 flex gap-1.5 overflow-x-auto px-3">
        {[{ kind: "all" as const, label: "すべて" }, ...LINK_KINDS].map((k) => (
          <button
            key={k.kind}
            type="button"
            role="tab"
            aria-selected={kind === k.kind}
            onClick={() => setKind(k.kind)}
            className={`min-h-11 shrink-0 rounded-full border px-3 text-xs font-bold ${kind === k.kind ? "border-night bg-night text-white" : "border-line bg-card"}`}
          >
            {k.label}
          </button>
        ))}
      </div>
      <label className="flex min-h-11 items-center justify-end gap-1 text-xs text-muted">
        <span className="sr-only">並べ替え</span>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="min-h-11 bg-transparent text-right text-xs font-bold text-ink outline-none">
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      {!links && <div className="h-40 rounded-2xl bg-line" aria-busy />}
      {links?.length === 0 && <p className="text-sm text-muted">いまは意見を募集しているものがありません。</p>}
      {links && links.length > 0 && shown.length === 0 && <p className="text-sm text-muted">見つかりませんでした。ことばや種類を変えてみてください。</p>}

      <ul className="flex flex-col gap-2">
        {shown.map((l) => {
          const isDone = done.has(l.id);
          const left = remaining(l.closesAt);
          return (
            <li key={l.id}>
              <Link href={`/l/${l.id}`} className={`flex items-center gap-2.5 rounded-2xl border border-line p-2 hover:border-coral ${isDone ? "bg-bg opacity-70" : "bg-card"}`}>
                <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-grape-tint">
                  {l.image ? <Image src={l.image} alt="" fill sizes="64px" className="object-cover" /> : <span className="font-round text-xl font-bold text-muted">{l.title.slice(0, 1)}</span>}
                </span>
                <span className="flex flex-1 flex-col items-start gap-1">
                  <span className="flex flex-wrap gap-1">
                    <KindLabel link={l} small />
                    {l.ownerAnswered >= ACTIVE_ANSWERER && <span className="rounded-full bg-leaf-tint px-2 py-px text-[10px] font-bold text-leaf-dark">よく答えている人</span>}
                  </span>
                  <span className="text-sm font-bold leading-snug">{l.title}</span>
                  <span className="text-[11px] text-muted">
                    {l.makerName}さん · 意見 {l.responseCount}件
                    {left && (left === "今日まで" ? <b className="text-coral"> · 今日まで</b> : ` · ${left}`)}
                  </span>
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-1.5 text-xs font-bold ${isDone ? "bg-leaf-tint" : "bg-coral text-night"}`}>{isDone ? "答えた" : "答える"}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link href="/new" className="flex min-h-11 items-center justify-center rounded-full border border-dashed border-line text-[13px] font-bold">
        ＋ 自分も意見を募集する
      </Link>
    </div>
  );
}
