import type { Metadata } from "next";

import { Header } from "@/components/Header";
import { NewLinkForm } from "@/components/NewLinkForm";

export const metadata: Metadata = { title: "意見を募集する｜意見リンク" };

/** 意見を募集する画面 */
export default function NewLinkPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-16 pt-3">
        <h1 className="font-round text-[22px] font-bold">意見を募集する</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">まだ形になっていなくても大丈夫。画像1枚から聞けます。</p>
        <NewLinkForm />
      </main>
    </>
  );
}
