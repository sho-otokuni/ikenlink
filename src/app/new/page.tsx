import type { Metadata } from "next";

import { Header, PAGE_WIDTH } from "@/components/Header";
import { NewLinkForm } from "@/components/NewLinkForm";

export const metadata: Metadata = { title: "意見を募集する｜意見リンク" };

/** 意見を募集する画面 */
export default function NewLinkPage() {
  return (
    <>
      <Header />
      <main className={`${PAGE_WIDTH} flex-1 px-3 pb-16 pt-3 lg:px-8 xl:px-12 lg:pt-8`}>
        <h1 className="font-round text-[22px] font-bold lg:text-[30px]">意見を募集する</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted lg:text-sm">まだ形になっていなくても大丈夫。画像1枚から聞けます。</p>
        <NewLinkForm />
      </main>
    </>
  );
}
