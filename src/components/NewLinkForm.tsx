"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { shrinkImage } from "@/lib/image";
import { createLink } from "@/lib/links";
import { QUESTION_COPY } from "@/lib/questions";
import type { Question, QuestionKind } from "@/lib/types";

const MAX_IMAGES = 3;
const MAX_FREE = 2;

/** 選べる型（自由な質問は別に足す）。最初は全部に印を付けておく */
const TEMPLATE_KINDS: { kind: Exclude<QuestionKind, "free">; note: string }[] = [
  { kind: "first_look", note: "画面を5秒だけ見せて、第一印象を聞きます（写真が必要）" },
  { kind: "would_use", note: "使いたい／たぶん／いらないかな" },
  { kind: "confused", note: "迷ったところを自由に書いてもらいます" },
  { kind: "price", note: "無料なら／100円／500円／1,000円以上" },
];

export function NewLinkForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [makerName, setMakerName] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [kinds, setKinds] = useState<QuestionKind[]>(TEMPLATE_KINDS.map((t) => t.kind));
  const [freeQuestions, setFreeQuestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 5秒テストは写真がないとできない
  const activeKinds = kinds.filter((k) => k !== "first_look" || images.length > 0);
  const questionCount = activeKinds.length + freeQuestions.filter((q) => q.trim()).length;
  const canSubmit = title.trim() !== "" && makerName.trim() !== "" && questionCount > 0 && !busy;

  async function addImages(files: FileList | null) {
    if (!files) return;
    const room = MAX_IMAGES - images.length;
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, room);
    const shrunk = await Promise.all(picked.map((f) => shrinkImage(f)));
    setImages((list) => [...list, ...shrunk].slice(0, MAX_IMAGES));
  }

  function toggleKind(kind: QuestionKind) {
    setKinds((list) => (list.includes(kind) ? list.filter((k) => k !== kind) : [...list, kind]));
  }

  async function submit() {
    setError(null);
    if (!canSubmit) return;
    const trimmedUrl = url.trim();
    if (trimmedUrl && !/^https?:\/\/\S+$/.test(trimmedUrl)) return setError("URL は https:// から始まる形で入れてください");
    setBusy(true);
    // 並びは型の順（5秒テストを最初に）、自由な質問は最後
    const questions: Question[] = [
      ...TEMPLATE_KINDS.filter((t) => activeKinds.includes(t.kind)).map((t, i) => ({ id: `q${i + 1}`, kind: t.kind })),
      ...freeQuestions
        .map((text) => text.trim())
        .filter(Boolean)
        .map((text, i) => ({ id: `f${i + 1}`, kind: "free" as const, text })),
    ];
    const r = await createLink({
      title: title.trim(),
      tagline: tagline.trim() || null,
      url: trimmedUrl || null,
      images,
      questions,
      makerName: makerName.trim(),
    });
    if (!r.ok) {
      setBusy(false);
      return setError(r.message);
    }
    router.push(`/me/${r.data}?created=1`);
  }

  return (
    <div className="mt-8 flex flex-col gap-8">
      <Section title="作ったもの">
        <Field label="名前" required>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} placeholder="例：DreamBeaver" aria-label="作ったものの名前" className={inputClass} />
        </Field>
        <Field label="URL" hint="触ってもらえる場所（なくても大丈夫）">
          <input value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" placeholder="https://" aria-label="URL" className={inputClass} />
        </Field>
        <Field label="ひとことの説明" hint="答える人には、5秒テストのあとで見せます">
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={60} placeholder="例：思いつきを置いて、仲間と形にするアプリ" aria-label="ひとことの説明" className={inputClass} />
        </Field>
        <Field label={`画面の写真（${images.length}/${MAX_IMAGES}）`} hint="1枚目が5秒テストで使われます。スマホの画面のスクショがおすすめ">
          <div className="flex flex-wrap gap-2">
            {images.map((src, i) => (
              <div key={src.slice(-40) + i} className="relative h-36 w-20 overflow-hidden rounded-xl border border-line bg-card">
                {/* eslint-disable-next-line @next/next/no-img-element -- 端末の中の写真（data URL）なので、Next.js の画像変換は使えない */}
                <img src={src} alt={`画面の写真 ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((list) => list.filter((_, k) => k !== i))}
                  aria-label={`画面の写真 ${i + 1} を外す`}
                  className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-night/70 text-sm text-white"
                >
                  ×
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <label className="flex h-36 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-xs text-muted hover:border-coral">
                <span className="text-2xl leading-none">＋</span>
                写真
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addImages(e.target.files)} />
              </label>
            )}
          </div>
        </Field>
      </Section>

      <Section title="聞きたいこと">
        <div className="flex flex-col gap-2">
          {TEMPLATE_KINDS.map((t) => {
            const disabled = t.kind === "first_look" && images.length === 0;
            const on = kinds.includes(t.kind) && !disabled;
            return (
              <label
                key={t.kind}
                className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border p-3 ${on ? "border-coral bg-coral-tint" : "border-line bg-card"} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <input type="checkbox" checked={on} disabled={disabled} onChange={() => toggleKind(t.kind)} className="mt-1 h-4 w-4 accent-[var(--coral)]" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold">{QUESTION_COPY[t.kind].label}</span>
                  <span className="text-xs text-muted">{t.note}</span>
                </span>
              </label>
            );
          })}
          {freeQuestions.map((q, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={q}
                onChange={(e) => setFreeQuestions((list) => list.map((x, k) => (k === i ? e.target.value : x)))}
                maxLength={60}
                placeholder="例：名前の印象はどうですか？"
                aria-label={`自由な質問 ${i + 1}`}
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => setFreeQuestions((list) => list.filter((_, k) => k !== i))}
                aria-label={`自由な質問 ${i + 1} を消す`}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-muted"
              >
                ×
              </button>
            </div>
          ))}
          {freeQuestions.length < MAX_FREE && (
            <button
              type="button"
              onClick={() => setFreeQuestions((list) => [...list, ""])}
              className="min-h-11 self-start rounded-full border border-dashed border-line px-4 text-sm font-bold text-muted hover:border-coral"
            >
              ＋ 自分で質問を書く
            </button>
          )}
        </div>
      </Section>

      <Section title="あなたのこと">
        <Field label="表示する名前" required hint="答える人に「〇〇さんが意見を募集しています」と出ます。ハンドルネームで大丈夫です">
          <input value={makerName} onChange={(e) => setMakerName(e.target.value)} maxLength={20} placeholder="例：きのと" aria-label="表示する名前" className={inputClass} />
        </Field>
      </Section>

      {error && <p role="alert" className="text-sm font-bold text-coral">{error}</p>}
      <button type="button" onClick={submit} disabled={!canSubmit} className="min-h-12 rounded-full bg-coral px-6 font-bold text-night disabled:opacity-40">
        {busy ? "作っています…" : "リンクを作る"}
      </button>
      <p className="-mt-4 text-center text-xs text-muted">質問は {questionCount} 個。答える人は30秒ほどで答えられます。</p>
    </div>
  );
}

const inputClass = "min-h-11 w-full rounded-xl border border-line bg-card px-3 text-base outline-none focus:border-coral";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-round text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-bold">
        {label}
        {required && <span className="ml-1 text-xs text-coral">必須</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}
