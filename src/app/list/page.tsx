import type { Metadata } from "next";

import { Header, PAGE_WIDTH } from "@/components/Header";
import { PublicList } from "@/components/PublicList";

export const metadata: Metadata = {
  title: "みんなの募集",
  description: "アプリ・サービス、アイデア、デザイン、文章など、公開中の意見募集の一覧です。気になる募集に、登録不要・匿名で30秒から回答できます。",
  alternates: { canonical: "/list" },
  openGraph: { title: "みんなの募集", url: "/list" },
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
