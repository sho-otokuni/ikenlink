import type { Metadata } from "next";
import Link from "next/link";

import { Header } from "@/components/Header";
import { SignupPanel } from "@/components/SignupPanel";

export const metadata: Metadata = { title: "アカウント登録｜意見リンク", robots: { index: false, follow: false } };

/** アカウント登録（ログイン）の画面。自分の募集の「アカウント登録」から来る */
export default function SignupPage() {
  return (
    <>
      <Header current="/me" />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 px-3 pb-12 pt-3">
        <Link href="/me" className="flex min-h-11 items-center self-start text-xs font-bold text-muted hover:text-ink">
          ‹ 自分の募集
        </Link>
        <h1 className="font-round text-2xl font-bold lg:text-[28px]">アカウント登録</h1>
        <SignupPanel />
      </main>
    </>
  );
}
