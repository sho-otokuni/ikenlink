import { Header, PAGE_WIDTH } from "@/components/Header";

/** 使い方・利用規約・プライバシーポリシーなど、読むためのページの共通の形 */
export function DocPage({ title, updated, lead, children }: { title: string; updated?: string; lead?: React.ReactNode; children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className={`${PAGE_WIDTH} flex-1 px-3 pb-16 pt-4 lg:px-8 xl:px-12 lg:pt-10`}>
        <article className="mx-auto flex max-w-2xl flex-col gap-6">
          <header className="flex flex-col gap-2">
            <h1 className="font-round text-2xl font-bold lg:text-[32px]">{title}</h1>
            {updated && <p className="text-xs text-muted">最終更新日：{updated}</p>}
            {lead && <div className="text-sm leading-relaxed">{lead}</div>}
          </header>
          {children}
        </article>
      </main>
    </>
  );
}

/** 見出し付きのまとまり */
export function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-round text-lg font-bold">{title}</h2>
      <div className="flex flex-col gap-2 text-sm leading-relaxed [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
    </section>
  );
}
