"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { answeredIds } from "@/lib/answered";
import { fetchPublicLinks, type PublicLink } from "@/lib/links";

/** 意見募集中の一覧。まだ答えていないものを先に、答えたものは「答えた」を付けて下に並べる */
export function PublicList() {
  const [links, setLinks] = useState<PublicLink[] | null>(null);
  const [answered, setAnswered] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  if (error) return <p role="alert" className="mt-6 text-sm font-bold text-coral">{error}</p>;
  if (!links) return <div className="mt-6 h-40 rounded-2xl bg-line" aria-busy />;
  if (links.length === 0) return <p className="mt-6 text-sm text-muted">いまは意見を募集しているものがありません。</p>;

  const done = new Set(answered);
  const sorted = [...links.filter((l) => !done.has(l.id)), ...links.filter((l) => done.has(l.id))];

  return (
    <ul className="mt-6 flex flex-col gap-3">
      {sorted.map((l) => {
        const isDone = done.has(l.id);
        return (
          <li key={l.id}>
            <Link
              href={`/l/${l.id}`}
              className={`flex min-h-20 items-center gap-3 rounded-2xl border p-4 hover:border-coral ${isDone ? "border-line bg-bg opacity-70" : "border-line bg-card"}`}
            >
              <div className="flex flex-1 flex-col gap-1">
                <span className="font-round text-lg font-bold leading-snug">{l.title}</span>
                <span className="text-xs text-muted">
                  {l.makerName}さん · 質問 {l.questionCount}個 · {new Date(l.createdAt).toLocaleDateString("ja-JP")}
                </span>
              </div>
              <span className="flex flex-col items-end gap-1">
                {isDone ? (
                  <span className="rounded-full bg-leaf-tint px-3 py-1 text-xs font-bold">答えた</span>
                ) : (
                  <span className="rounded-full bg-coral px-3 py-1 text-xs font-bold text-night">答える</span>
                )}
                <span className="text-xs text-muted">意見 {l.responseCount}件</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
