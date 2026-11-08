import type { Metadata } from "next";
import Link from "next/link";

import { Header } from "@/components/Header";
import { SettingsPanel } from "@/components/SettingsPanel";

export const metadata: Metadata = { title: "設定｜意見リンク", robots: { index: false, follow: false } };

/** 設定（アカウント・プロフィール・データの削除）。ヘッダーのアカウントのメニューと、マイページの画面から来る */
export default function SettingsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 px-3 pb-12 pt-3">
        <Link href="/me" className="flex min-h-11 items-center self-start text-xs font-bold text-muted hover:text-ink">
          ‹ マイページ
        </Link>
        <h1 className="font-round text-2xl font-bold lg:text-[28px]">設定</h1>
        <SettingsPanel />
      </main>
    </>
  );
}
