import type { Metadata } from "next";

import { Header } from "@/components/Header";
import { PublicList } from "@/components/PublicList";

export const metadata: Metadata = {
  title: "意見募集中｜意見リンク",
  description: "一人で作っている人たちが、作ったものへの意見を募集しています。登録なし、30秒で答えられます。",
};

/** 意見募集中の一覧（作った人が「載せる」を選んだリンク） */
export default function PublicListPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-20 pt-6">
        <h1 className="font-round text-2xl font-bold">意見募集中</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          一人で作っている人たちが、意見を待っています。どれも登録なし、30秒ほどで答えられます。あなたのひとことが、次の一歩になります。
        </p>
        <PublicList />
      </main>
    </>
  );
}
