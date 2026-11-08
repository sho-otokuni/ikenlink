import type { Metadata } from "next";
import { Suspense } from "react";

import { Header } from "@/components/Header";
import { MyLinks } from "@/components/MyLinks";

export const metadata: Metadata = { title: "マイページ｜意見リンク", robots: { index: false, follow: false } };

/** マイページ（プロフィールと、募集・回答の一覧） */
export default function MyLinksPage() {
  return (
    <>
      <Header current="/me" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-12 pt-3">
        {/* URL の ?tab= を読むので、読み込み中の形を Suspense で包む */}
        <Suspense fallback={<div className="h-40 rounded-lg bg-line" aria-busy />}>
          <MyLinks />
        </Suspense>
      </main>
    </>
  );
}
