"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AccountCard } from "@/components/AccountCard";
import { finishSwitch, getAccount, readLoginError, type Account, type LoginError } from "@/lib/auth";
import { fetchMyLinks, type MyLink } from "@/lib/links";
import { isClosed } from "@/lib/questions";

/**
 * 自分の募集の一覧。プロフィール・アカウント・データの削除は「設定」の画面にある。
 * ログインから戻ってくるのはこの画面なので、ログインの失敗や、募集を移した知らせはここに出す
 */
export function MyLinks() {
  const [links, setLinks] = useState<MyLink[] | null>(null);
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
      const [acc, r] = await Promise.all([getAccount(), fetchMyLinks()]);
      if (!alive) return;
      setLoginError(failure);
      setMoved(movedCount);
      setAccount(acc);
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
        <h1 className="font-round text-2xl font-bold">自分の募集</h1>
        {/* パソコンでは上の帯に「意見を募集する」があるので、スマホのときだけ出す */}
        <Link href="/new" className="flex min-h-11 items-center rounded-lg bg-coral px-4 text-[13px] font-bold text-night lg:hidden">
          ＋ 作る
        </Link>
      </div>
      {moved > 0 && <p className="rounded-lg border border-leaf bg-card px-3 py-2 text-sm font-bold">このブラウザで作成した募集を {moved} 件、アカウントに移しました。</p>}
      {/* 登録していない人には登録・ログインの入口を、ログインに失敗したときはその知らせを出す */}
      {account && (account.state !== "member" || loginError) && <AccountCard account={account} loginError={loginError} moved={0} compact />}
      {error && <p role="alert" className="text-sm font-bold text-coral">{error}</p>}
      {!links && !error && <div className="h-16 rounded-lg bg-line" aria-busy />}
      {links?.length === 0 && <p className="text-sm text-muted">まだ募集はありません。</p>}
      <ul className="flex flex-col gap-2">
        {links?.map((l) => (
          <li key={l.id}>
            <Link href={`/me/${l.id}`} className="flex min-h-14 items-center gap-3 rounded-lg border border-line bg-card p-2 pr-3 hover:border-coral">
              {/* 1枚目の画像（なければタイトルの1文字目）。みんなの募集のカードと同じ形 */}
              <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-grape-tint">
                {l.images[0] ? (
                  <Image src={l.images[0]} alt="" fill sizes="56px" className="object-cover" />
                ) : (
                  <span className="font-round text-xl font-bold text-muted">{l.title.slice(0, 1)}</span>
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-bold">{l.title}</span>
                <span className="text-xs text-muted">
                  {isClosed(l.closesAt) ? "締め切り" : l.isPublic ? "公開" : "リンクを知っている人だけ"}
                  {l.lastResponseAt ? ` · 最後の意見 ${new Date(l.lastResponseAt).toLocaleDateString("ja-JP")}` : ""}
                </span>
              </span>
              <span className="flex shrink-0 items-baseline gap-1 whitespace-nowrap">
                <span className="font-round text-2xl font-bold leading-none tabular-nums">{l.responseCount}</span>
                <span className="text-xs text-muted">件の意見</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs leading-relaxed text-muted">
        {account?.state === "member"
          ? "ログイン中のアカウントで作成した募集が並びます。"
          : (
              <>
                アカウント登録していない場合、このブラウザで作成した募集だけが並びます。
                <br />
                アカウント登録しないまま意見を見るときは、募集ごとの「自分専用のURL」をご利用ください。
              </>
            )}
      </p>
      <Link href="/settings" className="flex min-h-11 items-center self-start text-xs font-bold text-muted hover:text-ink">
        設定（表示名・アカウント・データの削除） ›
      </Link>
    </div>
  );
}
