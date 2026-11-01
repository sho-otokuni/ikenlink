import type { Metadata } from "next";

import { Header } from "@/components/Header";
import { MyLinks } from "@/components/MyLinks";

export const metadata: Metadata = { title: "自分のリンク｜意見リンク", robots: { index: false, follow: false } };

/** 自分が作った意見リンクの一覧 */
export default function MyLinksPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-20 pt-6">
        <MyLinks />
      </main>
    </>
  );
}
