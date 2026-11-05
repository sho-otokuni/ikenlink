"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { AnsweredCard } from "@/components/AnsweredCard";
import { LinkIcon } from "@/components/icons";
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
      <main className={`mx-auto flex w-full max-w-md flex-1 flex-col px-3 pb-12 pt-2 ${step === "answer" ? "lg:max-w-[1600px] lg:px-8 lg:pt-6 xl:px-12" : "lg:pt-6"}`}>
        {step === "answer" && (
          // パソコンでは、左に見てほしいもの、右のカードに質問を置く
          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_480px] lg:items-start lg:gap-8 xl:grid-cols-[1fr_540px]">
            {/* パソコンでは、ページのスクロールは1つだけ。左はページと一緒に動き、右の回答のカードは画面に止めておく（左を下まで読んでも、回答欄はそのまま見える） */}
            <About link={link} />
            <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:overscroll-contain thin-scrollbar lg:gap-4 lg:rounded-lg lg:border lg:border-line lg:bg-card lg:p-4 lg:shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
            {link.questions.map((q) => (
              <QuestionField key={q.id} question={q} value={answers[q.id] ?? ""} onChange={(v) => set(q.id, v)} />
            ))}
            <div className="flex flex-col gap-1.5">
              {error && (
                <p role="alert" className="text-center text-sm font-bold text-coral">
                  {error}
                </p>
              )}
              <button type="button" onClick={submit} disabled={!answered || sending} className="min-h-12 rounded-lg bg-coral px-6 font-bold text-night transition disabled:opacity-40">
                {sending ? "送っています…" : "意見を送る"}
              </button>
              <p className="text-center text-[11px] text-muted lg:text-xs">送った意見は、募集した人だけが読めます。名前は送られません。</p>
            </div>
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
    <section className="flex flex-col items-start gap-2 lg:gap-3.5">
      <p className="text-xs text-muted lg:text-[13px]">
        {link.makerName}さんが意見を募集しています
        {link.closesAt ? ` · ${formatDay(link.closesAt).replace(/（.）/, "")}まで` : ""}
      </p>
      <KindLabel link={link} />
      <h1 className="font-round text-[22px] font-bold leading-snug lg:text-[34px]">{link.title}</h1>
      {link.images.length > 0 && (
        <div className="-mx-3 flex w-[calc(100%+1.5rem)] gap-2 overflow-x-auto px-3 lg:mx-0 lg:w-full lg:flex-wrap lg:gap-3 lg:overflow-visible lg:px-0">
          {link.images.map((src, i) => {
            const caption = link.imageCaptions[i]?.trim();
            return (
              // 画像の下にタイトル（あれば）。幅は画像に合わせ、長いタイトルは折り返す
              <figure key={`${i}-${src}`} className="flex w-min shrink-0 flex-col gap-1.5">
                {/* 押すと、元の大きさで開く */}
                <a href={src} target="_blank" rel="noopener noreferrer" className="overflow-hidden rounded-lg border border-line bg-card">
                  {/* 見てほしいものの中心なので、すぐ読み込む（大きさが決まる前は幅0になり、遅らせると読み込まれないことがある） */}
                  <Image src={src} alt={caption || `画像 ${i + 1}`} width={0} height={0} sizes="320px" loading="eager" className="h-52 w-auto min-w-24 max-w-[80vw] object-contain lg:h-80 lg:max-w-full" />
                </a>
                {caption && <figcaption className="text-center text-xs leading-relaxed text-muted lg:text-sm">{caption}</figcaption>}
              </figure>
            );
          })}
        </div>
      )}
      {link.tagline && <p className="whitespace-pre-wrap text-sm leading-relaxed lg:text-base lg:leading-loose">{link.tagline}</p>}
      {link.urls.map((url, i) => (
        <a
          key={`${i}-${url}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 w-full items-center gap-2.5 rounded-lg border-2 border-coral bg-coral-tint px-3 py-2 lg:min-h-14 lg:px-3.5"
        >
          <LinkIcon />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-bold">リンク</span>
            {/* どこへ飛ぶのか分かるよう、URL もそのまま見せる */}
            <span className="truncate text-xs underline underline-offset-2 lg:text-[13px]">{url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
          </span>
          <span aria-hidden className="text-base font-bold">↗</span>
        </a>
      ))}
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
              className={`min-h-11 rounded-lg border px-4 text-sm font-bold transition ${value === c ? "border-coral bg-coral text-night" : "border-line bg-card"}`}
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
          className="rounded-lg border border-line bg-card px-3 py-2.5 text-base leading-relaxed outline-none focus:border-coral"
        />
      )}
    </fieldset>
  );
}

/** 一覧へ（お礼と締め切り後の画面の下） */
function Onward() {
  // 答えたあとの行き先は「みんなの募集」の一覧（使い始めた人にとっての「ホーム」はここ）
  return (
    <Link href="/list" className="flex min-h-12 w-full items-center justify-center rounded-lg bg-coral px-4 text-center font-bold text-night">
      一覧でほかの意見に答える
    </Link>
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
          body="3件以上答えると、あなたの募集のカードに「よく答えている人」の印が付きます。おたがいさまで、意見が集まる場所に。"
        />
      )}
      <Onward />
      {/* 答えた人が、次は募集する側になれるように */}
      <div className="flex flex-col gap-2 rounded-lg border border-line bg-card p-3">
        <b className="text-[15px]">あなたも「どう思う？」と聞いてみませんか</b>
        <p className="text-[13px] leading-relaxed">画像1枚から、同じように意見を集められます。</p>
        <Link href="/new" className="flex min-h-11 items-center justify-center rounded-lg bg-leaf font-bold text-night">
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
