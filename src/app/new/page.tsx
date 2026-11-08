import type { Metadata } from "next";

import { Header, PAGE_WIDTH } from "@/components/Header";
import { NewLinkForm } from "@/components/NewLinkForm";

export const metadata: Metadata = {
  title: "意見を募集する",
  description: "画像や URL、説明を添えて、意見を集めるリンクを無料で作成できます。質問は自由入力・選択式から設定でき、アカウント登録なしでも始められます。",
  alternates: { canonical: "/new" },
  openGraph: { title: "意見を募集する", url: "/new" },
};

/** 意見を募集する画面 */
export default function NewLinkPage() {
  return (
    <>
      <Header />
      <main className={`${PAGE_WIDTH} flex-1 px-3 pb-12 pt-3 lg:px-8 xl:px-12 lg:pt-5`}>
        <h1 className="font-round text-[22px] font-bold lg:text-[30px]">意見を募集する</h1>
        <NewLinkForm />
      </main>
    </>
  );
}
