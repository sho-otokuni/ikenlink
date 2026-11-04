"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AccountCard } from "@/components/AccountCard";
import { AnsweredCard } from "@/components/AnsweredCard";
import { finishSwitch, getAccount, readLoginError, type Account, type LoginError } from "@/lib/auth";
import { fetchMyAnswerCount, fetchMyLinks, type MyLink } from "@/lib/links";
import { isClosed } from "@/lib/questions";

export function MyLinks() {
  const [links, setLinks] = useState<MyLink[] | null>(null);
  const [answered, setAnswered] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loginError, setLoginError] = useState<LoginError>(null);
  const [moved, setMoved] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      // ログインから戻ってきたときは、失敗の知らせを読み、ログインし直した人にはこの端末の募集を移してから読む
      const failure = readLoginError();
      const movedCount = await finishSwitch();
      const [acc, r, n] = await Promise.all([getAccount(), fetchMyLinks(), fetchMyAnswerCount()]);
      if (!alive) return;
      setLoginError(failure);
      setMoved(movedCount);
      setAccount(acc);
      setAnswered(n);
      if (r.ok) setLinks(r.data);
      else setError(r.message);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-round text-2xl font-bold">自分のリンク</h1>
        <Link href="/new" className="flex min-h-11 items-center rounded-full bg-coral px-4 text-[13px] font-bold text-night">
          ＋ 作る
        </Link>
      </div>
      {account && <AccountCard account={account} loginError={loginError} moved={moved} />}
      {answered !== null && (
        <AnsweredCard count={answered} title="ほかの募集に答えた数" body="答えるほど、公開中の募集が一覧で前に出やすくなります。">
          <Link href="/list" className="flex min-h-11 items-center text-[13px] font-bold text-coral">
            募集に答えに行く ›
          </Link>
        </AnsweredCard>
      )}
      {error && <p role="alert" className="text-sm font-bold text-coral">{error}</p>}
      {!links && !error && <div className="h-16 rounded-2xl bg-line" aria-busy />}
      {links?.length === 0 && <p className="text-sm text-muted">まだ募集はありません。画像1枚からでも、意見を集められます。</p>}
      <ul className="flex flex-col gap-2">
        {links?.map((l) => (
          <li key={l.id}>
            <Link href={`/me/${l.id}`} className="flex min-h-14 items-center gap-3 rounded-2xl border border-line bg-card px-3 py-2.5 hover:border-coral">
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="font-bold">{l.title}</span>
                <span className="text-xs text-muted">
                  {isClosed(l.closesAt) ? "締め切り" : l.isPublic ? "公開" : "リンクを知っている人だけ"}
                  {l.lastResponseAt ? ` · 最後の意見 ${new Date(l.lastResponseAt).toLocaleDateString("ja-JP")}` : ""}
                </span>
              </span>
              <span className="flex flex-col items-end">
                <span className="font-round text-2xl font-bold tabular-nums">{l.responseCount}</span>
                <span className="text-[11px] text-muted">件の意見</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs leading-relaxed text-muted">
        {account?.state === "member"
          ? "ログインしたアカウントで作った募集が並びます。"
          : "登録なしのときは、このブラウザで作った募集だけが並びます。登録しないまま、ほかの端末から意見を見るときは、募集ごとの「自分専用の URL」を使ってください。"}
      </p>
    </div>
  );
}
