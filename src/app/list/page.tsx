import type { Metadata } from "next";

import { Header } from "@/components/Header";
import { PublicList } from "@/components/PublicList";

export const metadata: Metadata = {
  title: "意見募集中｜意見リンク",
  description: "アイデア、デザイン、作ったもの。いろんな人が「どう思う？」と意見を募集しています。登録なし、30秒で答えられます。",
};

/** 意見募集中の一覧（公開を選んだ、締め切り前の募集） */
export default function PublicListPage() {
  return (
    <>
      <Header current="/list" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-16 pt-3">
        <h1 className="font-round text-[22px] font-bold">意見募集中</h1>
        <p className="mb-2.5 mt-1 text-xs leading-relaxed text-muted">
          公開されている募集です。どれも登録なし、30秒ほどで答えられます。
          <br />
          よく答えている人の募集ほど、前に並びます。
        </p>
        <PublicList />
      </main>
    </>
  );
}
