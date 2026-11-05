import type { Metadata } from "next";

import { Header, PAGE_WIDTH } from "@/components/Header";
import { PublicList } from "@/components/PublicList";

export const metadata: Metadata = {
  title: "みんなの募集｜意見リンク",
  description: "アイデア、デザイン、作ったもの。いろんな人が「どう思う？」と意見を募集しています。登録なし、30秒で答えられます。",
};

/** みんなの募集の一覧（公開を選んだ、締め切り前の募集） */
export default function PublicListPage() {
  return (
    <>
      <Header current="/list" />
      <main className={`${PAGE_WIDTH} flex-1 px-3 pb-12 pt-3 lg:px-8 xl:px-12 lg:pt-5`}>
        <PublicList />
      </main>
    </>
  );
}
