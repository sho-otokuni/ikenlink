import type { Metadata } from "next";
import { Suspense } from "react";

import { Header, PAGE_WIDTH } from "@/components/Header";
import { LinkResults } from "@/components/LinkResults";

export const metadata: Metadata = { title: "届いた意見｜意見リンク", robots: { index: false, follow: false } };

/** 作った人が、リンクを共有し、届いた意見を見る画面 */
export default function ResultsPage(props: PageProps<"/me/[id]">) {
  return (
    <>
      <Header />
      <main className={`${PAGE_WIDTH} flex-1 px-3 pb-16 pt-3 lg:px-8 xl:px-12 lg:pt-8`}>
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
  // k は管理用の URL の合言葉（どの端末からでも意見を見られる）
  const token = typeof query.k === "string" && /^[A-Za-z0-9]{24,64}$/.test(query.k) ? query.k : null;
  return <LinkResults key={`${id}:${String(query.saved ?? "")}`} id={id} created={query.created === "1"} saved={!!query.saved} token={token} />;
}
