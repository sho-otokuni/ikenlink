"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchMyLinks, type MyLink } from "@/lib/links";

export function MyLinks() {
  const [links, setLinks] = useState<MyLink[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchMyLinks().then((r) => {
      if (!alive) return;
      if (r.ok) setLinks(r.data);
      else setError(r.message);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-round text-2xl font-bold">自分のリンク</h1>
        <Link href="/new" className="flex min-h-11 items-center rounded-full bg-coral px-4 text-sm font-bold text-night">
          ＋ 作る
        </Link>
      </div>
      {error && <p role="alert" className="text-sm font-bold text-coral">{error}</p>}
      {!links && !error && <div className="h-16 rounded-2xl bg-line" aria-busy />}
      {links?.length === 0 && <p className="text-sm text-muted">まだリンクはありません。作ったものの URL を貼って、最初のリンクを作ってみましょう。</p>}
      <ul className="flex flex-col gap-3">
        {links?.map((l) => (
          <li key={l.id}>
            <Link href={`/me/${l.id}`} className="flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-card p-3 hover:border-coral">
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="font-bold">{l.title}</span>
                <span className="text-xs text-muted">
                  質問 {l.questions.length}個
                  {l.lastResponseAt ? ` · 最後の意見 ${new Date(l.lastResponseAt).toLocaleDateString("ja-JP")}` : ""}
                </span>
              </div>
              <span className="flex flex-col items-end">
                <span className="font-round text-2xl font-bold tabular-nums">{l.responseCount}</span>
                <span className="text-xs text-muted">件の意見</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs leading-relaxed text-muted">
        いまは登録なしで使えます。リンクはこのブラウザに結びついているので、別の端末やブラウザからは見えません（メールでの引き継ぎは、これから作ります）。
      </p>
    </div>
  );
}
