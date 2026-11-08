"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { getAccount, signOut, type Account } from "@/lib/auth";

/**
 * ヘッダーの右端の、アカウントの入口。
 * まだ何も使っていない人には「ログイン」、使っている人（登録せずに使っている人も）には丸いアイコンを出し、
 * 押すと「マイページ・自分の回答・設定」と、ログアウト（登録していない人はログイン・アカウント登録）のメニューを開く
 */
export function AccountMenu() {
  const [account, setAccount] = useState<Account | null>(null);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    getAccount().then((a) => alive && setAccount(a));
    return () => {
      alive = false;
    };
  }, []);

  // メニューの外を押したとき・Esc で閉じる
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 読み込み中は、場所だけ取っておく（あとから出てきて、ほかの項目がずれないように）
  if (!account) return <span className="ml-1 h-9 w-9 shrink-0" aria-hidden />;

  // まだ何も使っていない人は「ログイン」だけ（マイページに出すものがない）
  if (account.state === "none") {
    return (
      <Link href="/login" className="ml-1 flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-lg border border-line px-3 text-[13px] font-bold lg:px-4 lg:text-sm">
        ログイン
      </Link>
    );
  }

  const member = account.state === "member";
  const name = account.displayName || (member ? account.who : null) || "ゲスト";
  const sub = member ? account.who : "未登録（このブラウザで利用中）";
  async function logout() {
    if (!window.confirm("ログアウトしますか？もう一度ログインすれば、募集と回答はまた確認できます。")) return;
    await signOut();
    // ログインの状態が変わったので、画面を丸ごと読み直す
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/");
  }

  return (
    <div ref={box} className="relative ml-1 shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`アカウントのメニュー（${name}）`}
        className="flex h-11 w-11 items-center justify-center rounded-full"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card font-round text-sm font-bold">
          {name.slice(0, 1).toUpperCase()}
        </span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 z-20 flex w-60 flex-col rounded-lg border border-line bg-card p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
          <div className="flex flex-col px-3 py-2">
            <b className="truncate text-sm">{name}</b>
            {sub && <span className="truncate text-xs text-muted">{sub}</span>}
          </div>
          <div className="my-1 h-px bg-line" />
          {[
            { href: "/me", label: "マイページ" },
            { href: "/me?tab=answers", label: "自分の回答" },
            { href: "/settings", label: "設定" },
          ].map((m) => (
            <Link key={m.href} role="menuitem" href={m.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-md px-3 text-sm hover:bg-line">
              {m.label}
            </Link>
          ))}
          <div className="my-1 h-px bg-line" />
          {member ? (
            <button type="button" role="menuitem" onClick={logout} className="flex min-h-11 items-center rounded-md px-3 text-left text-sm hover:bg-line">
              ログアウト
            </button>
          ) : (
            // 登録せずに使っている人は、ここから登録・ログインできる
            [
              { href: "/login", label: "ログイン" },
              { href: "/signup", label: "アカウント登録" },
            ].map((m) => (
              <Link key={m.href} role="menuitem" href={m.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-md px-3 text-sm hover:bg-line">
                {m.label}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
