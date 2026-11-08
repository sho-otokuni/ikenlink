import type { Metadata } from "next";
import Link from "next/link";

import { Header } from "@/components/Header";
import { LoginPanel } from "@/components/SignupPanel";

export const metadata: Metadata = { title: "ログイン｜意見リンク", robots: { index: false, follow: false } };

/** 登録済みのアカウントでログインする画面。自分の募集の「ログイン」から来る */
export default function LoginPage() {
  return (
    <>
      <Header current="/me" />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 px-3 pb-12 pt-3">
        <Link href="/me" className="flex min-h-11 items-center self-start text-xs font-bold text-muted hover:text-ink">
          ‹ 自分の募集
        </Link>
        <h1 className="font-round text-2xl font-bold lg:text-[28px]">ログイン</h1>
        <LoginPanel />
      </main>
    </>
  );
}
