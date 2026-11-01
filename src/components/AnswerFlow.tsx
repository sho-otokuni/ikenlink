"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { submitResponse } from "@/lib/links";
import { FIRST_LOOK_MS, QUESTION_COPY } from "@/lib/questions";
import type { Answers, FeedbackLink, Question } from "@/lib/types";

type Step = "intro" | "look" | "questions" | "done";

/**
 * 答える人の画面。登録なしで、スマホで30秒。
 * 5秒テストがあるときは、名前や説明を見せる前に画面だけを5秒見せ、「何に見えた？」を先に聞く。
 */
export function AnswerFlow({ link }: { link: FeedbackLink }) {
  const hasLook = link.images.length > 0 && link.questions.some((q) => q.kind === "first_look");
  const [step, setStep] = useState<Step>("intro");
  const [answers, setAnswers] = useState<Answers>({});
  // 5秒テストの「何に見えた？」に答えて「次へ」を押したか（それまでは答え合わせとほかの質問を隠す）
  const [lookDone, setLookDone] = useState(!hasLook);
  const lookQuestion = link.questions.find((q) => q.kind === "first_look");

  // 最初の画面のうちに、5秒テストの写真を読み込んでおく（見せたときに白い画面にならないように）
  useEffect(() => {
    if (!hasLook) return;
    const img = new window.Image();
    img.src = link.images[0];
  }, [hasLook, link.images]);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answered = Object.values(answers).some((v) => v.trim() !== "");
  const set = (id: string, value: string) => setAnswers((a) => ({ ...a, [id]: value }));

  async function submit() {
    if (!answered || sending) return;
    setSending(true);
    setError(null);
    const r = await submitResponse(link.id, answers);
    setSending(false);
    if (!r.ok) return setError(r.message);
    setStep("done");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-16 pt-6">
      <header className="mb-6 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-coral" aria-hidden />
        <span className="font-round text-sm font-bold text-muted">意見リンク</span>
      </header>

      {step === "intro" && <Intro link={link} hasLook={hasLook} onStart={() => setStep(hasLook ? "look" : "questions")} />}
      {step === "look" && <FirstLook image={link.images[0]} onDone={() => setStep("questions")} />}
      {step === "questions" && !lookDone && lookQuestion && (
        <div className="flex flex-col gap-6">
          <QuestionField question={lookQuestion} value={answers[lookQuestion.id] ?? ""} onChange={(v) => set(lookQuestion.id, v)} />
          <button type="button" onClick={() => setLookDone(true)} className="min-h-12 rounded-full bg-coral px-6 font-bold text-night">
            次へ
          </button>
        </div>
      )}
      {step === "questions" && lookDone && (
        <div className="flex flex-col gap-6">
          {/* 5秒テストに答えたあとで、答え合わせとして名前と説明を見せる */}
          <Reveal link={link} />
          {link.questions
            .filter((q) => q.kind !== "first_look")
            .map((q) => (
              <QuestionField key={q.id} question={q} value={answers[q.id] ?? ""} onChange={(v) => set(q.id, v)} />
            ))}
          <button
            type="button"
            onClick={submit}
            disabled={!answered || sending}
            className="min-h-12 rounded-full bg-coral px-6 font-bold text-night transition disabled:opacity-40"
          >
            {sending ? "送っています…" : "意見を送る"}
          </button>
          {error && (
            <p role="alert" className="text-center text-sm font-bold text-coral">
              {error}
            </p>
          )}
          <p className="text-center text-xs text-muted">送った意見は、作った人だけが読めます。名前は送られません。</p>
        </div>
      )}
      {step === "done" && <Done makerName={link.makerName} />}
    </main>
  );
}

function Intro({ link, hasLook, onStart }: { link: FeedbackLink; hasLook: boolean; onStart: () => void }) {
  return (
    <section className="flex flex-col gap-5">
      <h1 className="font-round text-2xl font-bold leading-snug">
        {link.makerName}さんが、
        <br />
        作ったものへの意見を募集しています
      </h1>
      <ul className="flex flex-col gap-2 text-sm text-muted">
        <li>・登録なし、30秒ほどで答えられます</li>
        <li>・思ったままの、正直な感想がいちばん助かります</li>
      </ul>
      {hasLook && (
        <div className="rounded-2xl bg-peach-tint p-4 text-sm leading-relaxed">
          はじめに、作ったものの画面を<strong>5秒だけ</strong>見せます。何のサービスに見えたかを教えてください。
        </div>
      )}
      <button type="button" onClick={onStart} className="min-h-12 rounded-full bg-coral px-6 font-bold text-night">
        {hasLook ? "5秒だけ見る" : "答える"}
      </button>
    </section>
  );
}

/** 画面を5秒だけ見せる。写真が表示されてから数え始め、上の線が縮みきったら質問へ */
function FirstLook({ image, onDone }: { image: string; onDone: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (!loaded) return;
    const raf = requestAnimationFrame(() => setStarted(true));
    const timer = setTimeout(onDone, FIRST_LOOK_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [loaded, onDone]);

  return (
    <section className="flex flex-col gap-3">
      <div className="h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="のこり時間">
        <div
          className="h-full bg-coral ease-linear"
          style={{ width: started ? "0%" : "100%", transitionProperty: "width", transitionDuration: `${FIRST_LOOK_MS}ms` }}
        />
      </div>
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-line bg-card">
        <Image
          src={image}
          alt="作ったものの画面"
          fill
          sizes="(max-width: 448px) 100vw, 448px"
          className="object-contain"
          priority
          // 先読みした写真と同じ URL を使うため、Next.js の画像変換を通さない
          unoptimized
          onLoad={() => setLoaded(true)}
        />
        {!loaded && <p className="absolute inset-0 flex items-center justify-center text-sm text-muted">読み込み中…</p>}
      </div>
    </section>
  );
}

function Reveal({ link }: { link: FeedbackLink }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
      <p className="text-xs font-bold text-muted">答え合わせ</p>
      <p className="font-round text-xl font-bold">{link.title}</p>
      {link.tagline && <p className="text-sm leading-relaxed">{link.tagline}</p>}
      {link.images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {link.images.map((src) => (
            <div key={src} className="relative aspect-[9/16] w-28 shrink-0 overflow-hidden rounded-xl border border-line">
              <Image src={src} alt="" fill sizes="112px" className="object-cover" />
            </div>
          ))}
        </div>
      )}
      {link.url && (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center justify-center rounded-full border border-line text-sm font-bold"
        >
          実際に触ってみる ↗
        </a>
      )}
    </div>
  );
}

function QuestionField({ question, value, onChange }: { question: Question; value: string; onChange: (v: string) => void }) {
  const copy = QUESTION_COPY[question.kind];
  const label = question.kind === "free" ? question.text ?? "" : copy.label;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-bold leading-snug">{label}</legend>
      {copy.hint && <p className="-mt-1 text-xs text-muted">{copy.hint}</p>}
      {copy.choices ? (
        <div className="flex flex-wrap gap-2">
          {copy.choices.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={value === c}
              onClick={() => onChange(value === c ? "" : c)}
              className={`min-h-11 rounded-full border px-4 text-sm font-bold transition ${
                value === c ? "border-coral bg-coral text-night" : "border-line bg-card"
              }`}
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
          rows={3}
          placeholder={copy.placeholder}
          aria-label={label}
          className="rounded-xl border border-line bg-card p-3 text-base leading-relaxed outline-none focus:border-coral"
        />
      )}
    </fieldset>
  );
}

function Done({ makerName }: { makerName: string }) {
  return (
    <section className="flex flex-col items-start gap-5">
      <h1 className="font-round text-2xl font-bold leading-snug">ありがとうございます！</h1>
      <p className="leading-relaxed">あなたの意見は、{makerName}さんに届きました。一人で作っている人にとって、何よりの手がかりになります。</p>
      {/* 答えた人が、次は作る側になれるように */}
      <div className="flex w-full flex-col gap-3 rounded-2xl bg-leaf-tint p-4">
        <p className="font-bold">あなたも、作ったものはありますか？</p>
        <p className="text-sm leading-relaxed">URL を貼るだけで、同じように意見を集めるリンクが作れます。</p>
        <Link href="/" className="flex min-h-11 items-center justify-center rounded-full bg-leaf font-bold text-night">
          意見リンクを作る
        </Link>
      </div>
    </section>
  );
}
