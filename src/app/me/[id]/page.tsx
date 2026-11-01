import type { Metadata } from "next";
import { Suspense } from "react";

import { Header } from "@/components/Header";
import { LinkResults } from "@/components/LinkResults";

export const metadata: Metadata = { title: "届いた意見｜意見リンク" };

/** 作った人が、リンクを共有し、届いた意見を見る画面 */
export default function ResultsPage(props: PageProps<"/me/[id]">) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-20 pt-6">
        <Suspense fallback={<div className="h-40 rounded-2xl bg-line" aria-busy />}>
          <Results params={props.params} searchParams={props.searchParams} />
        </Suspense>
      </main>
    </>
  );
}

// URL の id と「作ったばかりか」は、サーバー側で読んでから渡す
// （画面側で読むと、URL を直接開いたときに読み込み中のまま止まることがあったため）
async function Results({ params, searchParams }: Pick<PageProps<"/me/[id]">, "params" | "searchParams">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <LinkResults id={id} created={query.created === "1"} />;
}
