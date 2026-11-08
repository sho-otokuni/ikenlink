import type { Metadata } from "next";

import { Header } from "@/components/Header";
import { MyLinks } from "@/components/MyLinks";

export const metadata: Metadata = { title: "自分の募集｜意見リンク", robots: { index: false, follow: false } };

/** 自分の募集の一覧 */
export default function MyLinksPage() {
  return (
    <>
      <Header current="/me" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-12 pt-3">
        <MyLinks />
      </main>
    </>
  );
}
