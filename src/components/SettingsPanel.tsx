"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AccountCard } from "@/components/AccountCard";
import { DeleteAccount } from "@/components/DeleteAccount";
import { ProfileCard } from "@/components/ProfileCard";
import { getAccount, type Account } from "@/lib/auth";

/**
 * 設定：アカウント（ログイン中のアカウント・ログアウト／登録・ログインの入口）、プロフィール（表示名）、データの削除
 */
export function SettingsPanel() {
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    let alive = true;
    getAccount().then((a) => alive && setAccount(a));
    return () => {
      alive = false;
    };
  }, []);

  if (!account) return <div className="h-40 rounded-lg bg-line" aria-busy />;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold">アカウント</h2>
        {account.state === "member" ? (
          <AccountCard account={account} loginError={null} moved={0} />
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border border-line bg-card p-3">
            <p className="text-xs leading-relaxed text-muted">
              現在は登録せずにご利用中です。投稿した募集は、このブラウザにのみ保存されています。
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/signup" className="flex min-h-11 items-center rounded-lg bg-coral px-4 text-sm font-bold text-night">
                アカウント登録
              </Link>
              <Link href="/login" className="flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-bold">
                ログイン
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 表示名を残せるのは、ログインしている人だけ（ゲストは募集のたびに入力する） */}
      {account.state === "member" && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-bold">プロフィール</h2>
          <ProfileCard initialName={account.displayName} />
        </section>
      )}

      {account.state !== "none" && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-bold">データの削除</h2>
          <DeleteAccount account={account} />
        </section>
      )}
    </div>
  );
}
