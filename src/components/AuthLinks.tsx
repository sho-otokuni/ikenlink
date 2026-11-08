"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getAccount, type Account } from "@/lib/auth";

/**
 * トップページの「アカウント登録・ログイン」。ログイン済みの人には出さない。
 * アカウントの状態を読むまでは、何も出さない（あとから出たり消えたりして、ちらつかないように高さだけ取っておく）
 */
export function AuthLinks() {
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    let alive = true;
    getAccount().then((a) => alive && setAccount(a));
    return () => {
      alive = false;
    };
  }, []);

  if (account?.state === "member") return null;
  return (
    <p className={`flex min-h-11 flex-wrap items-center justify-center gap-x-1 text-sm text-muted lg:justify-start ${account ? "" : "invisible"}`}>
      <Link href="/signup" className="flex min-h-11 items-center font-bold text-ink underline-offset-4 hover:underline">
        アカウント登録
      </Link>
      <span aria-hidden>・</span>
      <Link href="/login" className="flex min-h-11 items-center font-bold text-ink underline-offset-4 hover:underline">
        ログイン
      </Link>
    </p>
  );
}
