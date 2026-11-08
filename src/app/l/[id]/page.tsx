import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AnswerFlow } from "@/components/AnswerFlow";
import { fetchPublicLinks, getLink } from "@/lib/links";

export async function generateMetadata(props: PageProps<"/l/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const [link, listed] = await Promise.all([getLink(id), fetchPublicLinks()]);
  if (!link) return { title: "募集が見つかりません", robots: { index: false, follow: false } };
  // 検索に載せるのは「みんなの募集」に並んでいる（公開・締め切り前の）募集だけ。非公開の募集は、リンクを知っている人だけのもの
  const isListed = listed.ok && listed.data.some((l) => l.id === link.id);
  const description = `${link.makerName}さんが意見を募集しています。${link.tagline ? `${link.tagline.replace(/\s+/g, " ").slice(0, 80)} ` : ""}登録不要・匿名で30秒から回答できます。`;
  return {
    title: link.title,
    description,
    alternates: { canonical: `/l/${link.id}` },
    robots: isListed ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { title: link.title, description, url: `/l/${link.id}`, type: "article" },
    twitter: { title: link.title, description },
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
