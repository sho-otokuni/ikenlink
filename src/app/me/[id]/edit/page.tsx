import type { Metadata } from "next";
import { Suspense } from "react";

import { EditLink } from "@/components/EditLink";
import { Header, PAGE_WIDTH } from "@/components/Header";

export const metadata: Metadata = { title: "募集を直す｜意見リンク", robots: { index: false, follow: false } };

/** 作った募集を直す画面（作った本人だけ） */
export default function EditLinkPage(props: PageProps<"/me/[id]/edit">) {
  return (
    <>
      <Header />
      <main className={`${PAGE_WIDTH} flex-1 px-3 pb-16 pt-3 lg:px-0 lg:pt-8`}>
        <h1 className="font-round text-[22px] font-bold lg:text-[30px]">募集を直す</h1>
        <Suspense fallback={<div className="mt-4 h-40 rounded-2xl bg-line" aria-busy />}>
          <Edit params={props.params} />
        </Suspense>
      </main>
    </>
  );
}

async function Edit({ params }: Pick<PageProps<"/me/[id]/edit">, "params">) {
  const { id } = await params;
  return <EditLink id={id} />;
}
