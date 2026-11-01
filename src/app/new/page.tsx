import type { Metadata } from "next";

import { Header } from "@/components/Header";
import { NewLinkForm } from "@/components/NewLinkForm";

export const metadata: Metadata = { title: "意見リンクを作る｜意見リンク" };

/** 意見リンクを作る画面 */
export default function NewLinkPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-20 pt-6">
        <h1 className="font-round text-2xl font-bold">意見リンクを作る</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">作ったものと、聞きたいことを決めるだけ。できたリンクを X などに貼ると、意見が集まります。</p>
        <NewLinkForm />
      </main>
    </>
  );
}
