"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { KindLabel } from "@/components/KindLabel";
import { getAccount, type Account } from "@/lib/auth";
import { fetchMyAnswers, type MyAnswer } from "@/lib/links";
import { answerValues, questionLabel } from "@/lib/questions";

/** 自分の回答：これまでに答えた意見を、答えた募集ごとに新しい順で並べる（アカウント登録している人だけ） */
export function MyAnswers() {
  const [account, setAccount] = useState<Account | null>(null);
  const [answers, setAnswers] = useState<MyAnswer[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [acc, r] = await Promise.all([getAccount(), fetchMyAnswers()]);
      if (!alive) return;
      setAccount(acc);
      if (r.ok) setAnswers(r.data);
      else setError(r.message);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (error) return <p role="alert" className="text-sm font-bold text-coral">{error}</p>;
  if (!account || !answers) return <div className="h-40 rounded-lg bg-line" aria-busy />;

  if (account.state !== "member") {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-line bg-card p-4">
        <b className="text-sm">回答履歴の閲覧には、アカウント登録が必要です</b>
        <p className="text-xs leading-relaxed text-muted">
          このブラウザでアカウントを登録すると、これまでの回答とこれからの回答を、このページで確認できます。
        </p>
        <Link href="/signup" className="flex min-h-11 items-center rounded-lg bg-coral px-5 text-sm font-bold text-night">
          アカウントを登録する
        </Link>
      </div>
    );
  }

  if (answers.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted">回答履歴はありません。</p>
        <Link href="/list" className="flex min-h-11 items-center text-sm font-bold text-coral">
          みんなの募集を見る ›
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
      {answers.map((a) => (
        <li key={a.id} className="flex flex-col gap-2.5 rounded-lg border border-line bg-card p-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-grape-tint">
              {a.link.image ? (
                <Image src={a.link.image} alt="" fill sizes="48px" className="object-cover" />
              ) : (
                <span className="font-round text-lg font-bold text-muted">{a.link.title.slice(0, 1)}</span>
              )}
            </span>
            <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
              <KindLabel link={a.link} small />
              <b className="text-sm leading-snug">{a.link.title}</b>
              <span className="text-[11px] text-muted">
                {a.link.makerName}さんの募集 · {new Date(a.answeredAt).toLocaleDateString("ja-JP")}に回答
              </span>
            </span>
          </div>
          <dl className="m-0 flex flex-col gap-2">
            {a.link.questions
              .filter((q) => (a.answers[q.id] ?? "").trim())
              .map((q) => (
                <div key={q.id} className="flex flex-col gap-0.5">
                  <dt className="text-xs font-bold text-muted">{questionLabel(q)}</dt>
                  <dd className="m-0 whitespace-pre-wrap rounded-lg bg-bg px-2.5 py-1.5 text-[13px] leading-relaxed">{answerValues(q, a.answers[q.id]).join("、")}</dd>
                </div>
              ))}
          </dl>
          <Link href={`/l/${a.link.id}`} className="flex min-h-11 items-center self-end text-xs font-bold text-muted hover:text-ink">
            募集を開く ›
          </Link>
        </li>
      ))}
    </ul>
  );
}
