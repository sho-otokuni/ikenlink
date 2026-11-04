"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { AnsweredCard } from "@/components/AnsweredCard";
import { Header } from "@/components/Header";
import { KindLabel } from "@/components/KindLabel";
import { markAnswered } from "@/lib/answered";
import { fetchMyAnswerCount, submitResponse } from "@/lib/links";
import { formatDay, isClosed, QUESTION_COPY } from "@/lib/questions";
import type { Answers, FeedbackLink, Question } from "@/lib/types";

type Step = "answer" | "done" | "closed";

/**
 * 答える人の画面。登録なしで、スマホで30秒。
 * 見てほしいもの（画像・説明・URL）と質問を1画面に並べ、そのまま送る
 */
export function AnswerFlow({ link }: { link: FeedbackLink }) {
  const [step, setStep] = useState<Step>(() => (isClosed(link.closesAt) ? "closed" : "answer"));
  const [answers, setAnswers] = useState<Answers>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 送ったあとに出す、これまでに答えた数（数えられなかったときは null）
  const [answeredCount, setAnsweredCount] = useState<number | null>(null);

  const answered = Object.values(answers).some((v) => v.trim() !== "");
  const set = (id: string, value: string) => setAnswers((a) => ({ ...a, [id]: value }));

  async function submit() {
    if (!answered || sending) return;
    setSending(true);
    setError(null);
    const r = await submitResponse(link.id, answers);
    if (!r.ok) {
      setSending(false);
      if (r.message.includes("締め切")) return setStep("closed");
      return setError(r.message);
    }
    markAnswered(link.id);
    setAnsweredCount(await fetchMyAnswerCount());
    setSending(false);
    setStep("done");
    window.scrollTo({ top: 0 });
  }

  return (
    <>
      <Header answerer />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-3 pb-16 pt-2">
        {step === "answer" && (
          <div className="flex flex-col gap-4">
            <About link={link} />
            {link.questions.map((q) => (
              <QuestionField key={q.id} question={q} value={answers[q.id] ?? ""} onChange={(v) => set(q.id, v)} />
            ))}
            <div className="flex flex-col gap-1.5">
              {error && (
                <p role="alert" className="text-center text-sm font-bold text-coral">
                  {error}
                </p>
              )}
              <button type="button" onClick={submit} disabled={!answered || sending} className="min-h-12 rounded-full bg-coral px-6 font-bold text-night transition disabled:opacity-40">
                {sending ? "送っています…" : "意見を送る"}
              </button>
              <p className="text-center text-[11px] text-muted">送った意見は、募集した人だけが読めます。名前は送られません。</p>
            </div>
          </div>
        )}
        {step === "done" && <Done makerName={link.makerName} answeredCount={answeredCount} />}
        {step === "closed" && <Closed link={link} />}
      </main>
    </>
  );
}

/** 見てほしいもの（だれの募集か・種類・タイトル・画像・説明・URL） */
function About({ link }: { link: FeedbackLink }) {
  return (
    <section className="flex flex-col items-start gap-2">
      <p className="text-xs text-muted">
        {link.makerName}さんが意見を募集しています
        {link.closesAt ? ` · ${formatDay(link.closesAt).replace(/（.）/, "")}まで` : ""} · 登録なし・30秒
      </p>
      <KindLabel link={link} />
      <h1 className="font-round text-[22px] font-bold leading-snug">{link.title}</h1>
      {link.images.length > 0 && (
        <div className="-mx-3 flex w-[calc(100%+1.5rem)] gap-2 overflow-x-auto px-3">
          {link.images.map((src, i) => (
            // 押すと、元の大きさで開く
            <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="shrink-0 overflow-hidden rounded-xl border border-line bg-card">
              {/* 見てほしいものの中心なので、すぐ読み込む（大きさが決まる前は幅0になり、遅らせると読み込まれないことがある） */}
              <Image src={src} alt={`画像 ${i + 1}`} width={0} height={0} sizes="320px" loading="eager" className="h-52 w-auto min-w-24 max-w-[80vw] object-contain" />
            </a>
          ))}
        </div>
      )}
      {link.tagline && <p className="whitespace-pre-wrap text-sm leading-relaxed">{link.tagline}</p>}
      {link.url && (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center rounded-full border border-line bg-card px-4 text-sm font-bold"
        >
          実際に見てみる ↗
        </a>
      )}
    </section>
  );
}

function QuestionField({ question, value, onChange }: { question: Question; value: string; onChange: (v: string) => void }) {
  const copy = QUESTION_COPY[question.kind];
  const label = question.kind === "free" ? question.text ?? "" : copy.label;
  return (
    <fieldset className="flex flex-col">
      <legend className="mb-1.5 text-[15px] font-bold leading-snug">{label}</legend>
      {copy.choices ? (
        <div className="flex flex-wrap gap-2">
          {copy.choices.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={value === c}
              onClick={() => onChange(value === c ? "" : c)}
              className={`min-h-11 rounded-full border px-4 text-sm font-bold transition ${value === c ? "border-coral bg-coral text-night" : "border-line bg-card"}`}
            >
              {c}
            </button>
          ))}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder={copy.placeholder}
          aria-label={label}
          className="rounded-xl border border-line bg-card px-3 py-2.5 text-base leading-relaxed outline-none focus:border-coral"
        />
      )}
    </fieldset>
  );
}

/** 一覧へ・ホームへ（お礼と締め切り後の画面の下） */
function Onward() {
  return (
    <>
      <Link href="/list" className="flex min-h-12 w-full items-center justify-center rounded-full bg-coral px-4 text-center font-bold text-night">
        一覧でほかの募集に答える
      </Link>
      <Link href="/" className="-mt-1.5 flex min-h-12 w-full items-center justify-center rounded-full border border-line bg-card font-bold">
        ホームに戻る
      </Link>
    </>
  );
}

function Done({ makerName, answeredCount }: { makerName: string; answeredCount: number | null }) {
  return (
    <section className="flex flex-col gap-3.5 pt-2">
      <h1 className="font-round text-2xl font-bold">ありがとうございます！</h1>
      <p className="text-sm leading-relaxed">あなたの意見は、{makerName}さんに届きました。迷っている人にとって、何よりの手がかりになります。</p>
      {answeredCount !== null && answeredCount > 0 && (
        <AnsweredCard
          count={answeredCount}
          title={`これまでに答えた数が ${answeredCount} 件になりました`}
          body="答えるほど、あなたの募集も「意見募集中」で前に出やすくなります。おたがいさまで、意見が集まる場所に。"
        />
      )}
      <Onward />
      {/* 答えた人が、次は募集する側になれるように */}
      <div className="flex flex-col gap-2 rounded-2xl bg-leaf-tint p-3">
        <b className="text-[15px]">あなたも「どう思う？」と聞いてみませんか</b>
        <p className="text-[13px] leading-relaxed">画像1枚から、同じように意見を集められます。</p>
        <Link href="/new" className="flex min-h-11 items-center justify-center rounded-full bg-leaf font-bold text-night">
          意見を募集する
        </Link>
      </div>
    </section>
  );
}

function Closed({ link }: { link: FeedbackLink }) {
  return (
    <section className="flex flex-col items-start gap-3.5 pt-2">
      <span className="rounded-full bg-line px-2.5 py-0.5 text-xs font-bold">締め切りました</span>
      <h1 className="font-round text-[22px] font-bold leading-snug">{link.title}</h1>
      <p className="text-sm leading-relaxed">
        この募集は{link.closesAt ? ` ${formatDay(link.closesAt).replace(/（.）/, "")} に` : ""}締め切られました。のぞいてくれて、ありがとうございます。
      </p>
      <Onward />
    </section>
  );
}
