import type { Metadata } from "next";

import { Header, PAGE_WIDTH } from "@/components/Header";
import { NewLinkForm } from "@/components/NewLinkForm";

export const metadata: Metadata = { title: "意見を募集する｜意見リンク" };

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
