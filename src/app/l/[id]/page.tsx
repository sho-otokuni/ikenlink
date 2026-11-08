import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AnswerFlow } from "@/components/AnswerFlow";
import { getLink } from "@/lib/links";

export async function generateMetadata(props: PageProps<"/l/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const link = await getLink(id);
  if (!link) return { title: "意見リンク" };
  return {
    title: `${link.title}｜意見リンク`,
    description: `${link.makerName}さんが意見を募集しています。登録不要、30秒で回答できます。`,
  };
}

/** 答える人の画面（登録なしで答えられる）。リンクを読むあいだは、骨組みだけ先に出す */
export default function AnswerPage(props: PageProps<"/l/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <LinkAnswer params={props.params} />
    </Suspense>
  );
}

async function LinkAnswer({ params }: { params: PageProps<"/l/[id]">["params"] }) {
  const { id } = await params;
  const link = await getLink(id);
  if (!link) notFound();
  return <AnswerFlow link={link} />;
}

function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pt-6" aria-busy>
      <div className="h-4 w-24 rounded-full bg-line" />
      <div className="mt-4 h-8 w-4/5 rounded-lg bg-line" />
      <div className="h-8 w-3/5 rounded-lg bg-line" />
      <div className="mt-6 h-12 w-full rounded-lg bg-line" />
    </main>
  );
}
