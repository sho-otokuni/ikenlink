"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { LinkCard } from "@/components/PublicList";
import { fetchPublicLinks, type PublicLink } from "@/lib/links";

/** はじめの画面（パソコンの幅だけ）の「いま意見を募集中」。新しい順に4つ（広い画面では5つ） */
export function RecentLinks() {
  const [links, setLinks] = useState<PublicLink[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetchPublicLinks().then((r) => alive && r.ok && setLinks(r.data.slice(0, 5)));
    return () => {
      alive = false;
    };
  }, []);

  if (!links || links.length === 0) return null;
  return (
    <section className="hidden flex-col gap-3.5 lg:flex">
      <div className="flex items-end justify-between">
        <h2 className="font-round text-[22px] font-bold">いま意見を募集中</h2>
        <Link href="/list" className="flex min-h-11 items-center text-sm font-bold text-coral">
          すべて見る ›
        </Link>
      </div>
      <ul className="grid grid-cols-4 gap-4 xl:grid-cols-5">
        {links.map((l, i) => (
          // 4列のときは5件目を出さない（1件だけ次の行に落ちないように）
          <li key={l.id} className={i === 4 ? "hidden xl:flex" : "flex"}>
            <LinkCard link={l} done={false} />
          </li>
        ))}
      </ul>
    </section>
  );
}
