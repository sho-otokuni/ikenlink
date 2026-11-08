"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AccountCard } from "@/components/AccountCard";
import { MyAnswers } from "@/components/MyAnswers";
import { ProfileCard } from "@/components/ProfileCard";
import { finishSwitch, getAccount, readLoginError, type Account, type LoginError } from "@/lib/auth";
import { fetchMyAnswerCount, fetchMyLinks, type MyLink } from "@/lib/links";
import { isClosed } from "@/lib/questions";

/**
 * マイページ。上にプロフィール（名前・名前の変更・募集と回答の数・設定）、下に「募集」「回答」の切り替え。
 * ログインから戻ってくるのはこの画面なので、ログインの失敗や、募集を移した知らせもここに出す
 */
export function MyLinks() {
  const [links, setLinks] = useState<MyLink[] | null>(null);
  const [answered, setAnswered] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loginError, setLoginError] = useState<LoginError>(null);
  const [moved, setMoved] = useState(0);
  // 「募集」「回答」のどちらを出すかは URL（?tab=answers）で決める。メニューの「自分の回答」から来たときも回答の側になる
  const router = useRouter();
  const pathname = usePathname();
  const tab = useSearchParams().get("tab") === "answers" ? "answers" : "links";
  const setTab = (next: "links" | "answers") => router.replace(next === "answers" ? `${pathname}?tab=answers` : pathname, { scroll: false });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

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
      setName(acc.state === "none" ? "" : acc.displayName);
      setAnswered(n);
      if (r.ok) setLinks(r.data);
      else setError(r.message);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const tabButton = (id: "links" | "answers", label: string, count: number | null) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      className={`relative flex min-h-11 flex-1 items-center justify-center gap-1.5 text-sm font-bold ${
        tab === id ? "text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-coral" : "text-muted hover:text-ink"
      }`}
    >
      {label}
      {count !== null && <span className="text-xs font-normal tabular-nums text-muted">{count}</span>}
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">マイページ</h1>

      {/* プロフィール */}
      <section className="flex flex-col gap-3 rounded-lg border border-line bg-card p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line bg-bg font-round text-xl font-bold">
            {(name || "？").slice(0, 1).toUpperCase()}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <b className="truncate font-round text-lg">{name || "名前未設定"}</b>
            <span className="truncate text-xs text-muted">
              {account?.state === "member" ? (account.who ?? "ログイン中") : "未登録（このブラウザで利用中）"}
            </span>
          </span>
        </div>
        <div className="flex gap-2">
          {account && account.state !== "none" && (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              aria-expanded={editing}
              className="flex min-h-10 flex-1 items-center justify-center rounded-lg border border-line text-[13px] font-bold"
            >
              {editing ? "閉じる" : "名前を変更"}
            </button>
          )}
          <Link href="/settings" className="flex min-h-10 flex-1 items-center justify-center rounded-lg border border-line text-[13px] font-bold">
            設定
          </Link>
        </div>
        {editing && account && account.state !== "none" && <ProfileCard initialName={name} onSaved={setName} />}
      </section>

      {moved > 0 && <p className="rounded-lg border border-leaf bg-card px-3 py-2 text-sm font-bold">このブラウザで作成した募集を {moved} 件、アカウントに移しました。</p>}
      {/* 登録していない人には登録・ログインの入口を、ログインに失敗したときはその知らせを出す */}
      {account && (account.state !== "member" || loginError) && <AccountCard account={account} loginError={loginError} moved={0} compact />}

      {/* 募集と回答の切り替え */}
      <div role="tablist" aria-label="マイページの表示" className="flex border-b border-line">
        {tabButton("links", "募集", links ? links.length : null)}
        {tabButton("answers", "回答", answered)}
      </div>

      {tab === "answers" ? (
        <MyAnswers />
      ) : (
      <div className="flex flex-col gap-3">
      {/* パソコンでは上の帯に「意見を募集する」があるので、スマホのときだけ出す */}
      <Link href="/new" className="flex min-h-11 items-center justify-center rounded-lg border border-dashed border-line text-[13px] font-bold lg:hidden">
        ＋ 意見を募集する
      </Link>
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
                <span className="text-xs text-muted">意見の数</span>
                <span className="font-round text-2xl font-bold leading-none tabular-nums">{l.responseCount}</span>
                <span className="text-xs text-muted">件</span>
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
                アカウント登録しないまま意見を見るときは、募集ごとの「管理用 URL」をご利用ください。
              </>
            )}
      </p>
      </div>
      )}
    </div>
  );
}
