import type { Metadata } from "next";
import Link from "next/link";

import { Header, PAGE_WIDTH } from "@/components/Header";
import { MyAnswers } from "@/components/MyAnswers";

export const metadata: Metadata = { title: "自分の回答｜意見リンク", robots: { index: false, follow: false } };

/** 自分がこれまでに答えた意見（アカウント登録している人だけ） */
export default function MyAnswersPage() {
  return (
    <>
      <Header current="/me" />
      <main className={`${PAGE_WIDTH} flex-1 px-3 pb-16 pt-3 lg:px-8 xl:px-12 lg:pt-8`}>
        <Link href="/me" className="flex min-h-11 items-center self-start text-xs font-bold text-muted hover:text-ink">
          ‹ 自分のリンク
        </Link>
        <h1 className="mb-3 font-round text-2xl font-bold lg:text-[28px]">自分の回答</h1>
        <MyAnswers />
      </main>
    </>
  );
}
