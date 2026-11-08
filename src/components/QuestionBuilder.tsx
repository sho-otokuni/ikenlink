"use client";

import { CharCount } from "@/components/CharCount";
import {
  DEFAULT_QUESTION_TEXT,
  MAX_CHOICE_TEXT,
  MAX_CHOICES,
  MAX_QUESTION_TEXT,
  MAX_QUESTIONS,
  MIN_CHOICES,
  QUESTION_PRESETS,
  QUESTION_TYPES,
  questionChoices,
  questionLabel,
} from "@/lib/questions";
import type { Question } from "@/lib/types";

/**
 * 作る画面で書いている途中の質問。key は並べ替え・削除のための目印（保存するときは q1, q2… に付け直す）。
 * fallback は、質問文を空のままにしたときに使う文（入力欄には薄い例の文として出す）
 */
export type QuestionDraft = { key: string; kind: "free" | "single" | "multi"; text: string; choices: string[]; fallback?: string };

/** 保存するときの質問文（空なら fallback） */
export function draftText(d: QuestionDraft) {
  return d.text.trim() || d.fallback || "";
}

let seq = 0;
const newKey = () => `d${++seq}`;

/** 新しく募集するときの質問：自由入力が1つだけ。文は空にしておき、空のままなら「あなたの意見をお聞かせください」にする */
export function defaultDrafts(): QuestionDraft[] {
  return [{ key: newKey(), kind: "free", text: "", choices: [], fallback: DEFAULT_QUESTION_TEXT }];
}

/** 保存してある質問を、書いている途中の形にする（前の版の決まった質問も、文と選択肢を写して直せるようにする） */
export function draftsFrom(questions: Question[]): QuestionDraft[] {
  return questions.map((q) => {
    const choices = questionChoices(q);
    const kind = q.kind === "multi" ? "multi" : choices ? "single" : "free";
    return { key: newKey(), kind, text: questionLabel(q), choices: choices ? [...choices] : [] };
  });
}

/** 書いている途中の質問を確かめる。問題がなければ null、あれば知らせる文 */
export function checkDrafts(drafts: QuestionDraft[]): string | null {
  if (drafts.length === 0) return "質問を1つ以上入れてください";
  for (const [i, d] of drafts.entries()) {
    if (!draftText(d)) return `質問 ${i + 1} の文を入れてください`;
    if (d.kind !== "free") {
      const choices = d.choices.map((c) => c.trim()).filter(Boolean);
      if (choices.length < MIN_CHOICES) return `質問 ${i + 1} の選択肢を${MIN_CHOICES}つ以上入れてください`;
      if (new Set(choices).size !== choices.length) return `質問 ${i + 1} に同じ選択肢があります`;
    }
  }
  return null;
}

/** 保存する形にする（id は q1, q2…。選択肢は空のものを外す） */
export function toQuestions(drafts: QuestionDraft[]): Question[] {
  return drafts.map((d, i) => {
    const text = draftText(d);
    if (d.kind === "free") return { id: `q${i + 1}`, kind: "free", text };
    return { id: `q${i + 1}`, kind: d.kind, text, choices: d.choices.map((c) => c.trim()).filter(Boolean) };
  });
}

const inputClass = "min-h-11 w-full rounded-lg border border-line bg-card px-3 text-base outline-none focus:border-coral";

/**
 * 聞きたいことを作る。質問ごとに、形式（自由入力・選択式（1つ選択）・選択式（複数選択））を選び、
 * 選択式なら選択肢を自分で書く。よく使われる質問は、押すと中身が入った状態で足される
 */
export function QuestionBuilder({ drafts, onChange }: { drafts: QuestionDraft[]; onChange: (next: QuestionDraft[]) => void }) {
  const update = (key: string, patch: Partial<QuestionDraft>) => onChange(drafts.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  const remove = (key: string) => onChange(drafts.filter((d) => d.key !== key));
  const full = drafts.length >= MAX_QUESTIONS;
  // すでに同じ文の質問があるものは、よく使われる質問から外す
  const presets = QUESTION_PRESETS.filter((p) => !drafts.some((d) => d.text.trim() === p.text));

  return (
    <div className="flex flex-col gap-3">
      {drafts.map((d, i) => (
        <div key={d.key} className="flex flex-col gap-2.5 rounded-lg border border-line bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <b className="text-sm">質問 {i + 1}</b>
            <button
              type="button"
              onClick={() => remove(d.key)}
              aria-label={`質問 ${i + 1} を消す`}
              className="flex min-h-11 items-center px-2 text-xs font-bold text-muted hover:text-coral"
            >
              削除
            </button>
          </div>

          <div role="radiogroup" aria-label={`質問 ${i + 1} の形式`} className="flex flex-wrap gap-1.5">
            {QUESTION_TYPES.map((t) => (
              <button
                key={t.kind}
                type="button"
                role="radio"
                aria-checked={d.kind === t.kind}
                onClick={() =>
                  // 選択式にしたとき、選択肢がなければ空の欄を2つ用意する
                  update(d.key, { kind: t.kind, choices: t.kind !== "free" && d.choices.length === 0 ? ["", ""] : d.choices })
                }
                className={`min-h-11 rounded-full border px-3 text-xs font-bold ${d.kind === t.kind ? "border-coral bg-coral-tint" : "border-line bg-card"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-1">
            <span className="flex items-baseline text-xs font-bold">
              質問文
              <CharCount value={d.text} max={MAX_QUESTION_TEXT} />
            </span>
            <input
              value={d.text}
              onChange={(e) => update(d.key, { text: e.target.value })}
              maxLength={MAX_QUESTION_TEXT}
              placeholder={d.fallback ?? "例：名前の印象はどうですか？"}
              aria-label={`質問 ${i + 1} の文`}
              className={inputClass}
            />
          </label>

          {d.kind !== "free" && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold">
                選択肢
                <span className="ml-1 font-normal text-muted">
                  （{MIN_CHOICES}〜{MAX_CHOICES}個・{d.kind === "single" ? "1つ選択" : "複数選択可"}）
                </span>
              </span>
              {d.choices.map((c, k) => (
                <div key={k} className="flex items-center gap-2">
                  <input
                    value={c}
                    onChange={(e) => update(d.key, { choices: d.choices.map((x, j) => (j === k ? e.target.value : x)) })}
                    maxLength={MAX_CHOICE_TEXT}
                    placeholder={`選択肢 ${k + 1}`}
                    aria-label={`質問 ${i + 1} の選択肢 ${k + 1}`}
                    className={`${inputClass} flex-1`}
                  />
                  {d.choices.length > MIN_CHOICES && (
                    <button
                      type="button"
                      onClick={() => update(d.key, { choices: d.choices.filter((_, j) => j !== k) })}
                      aria-label={`質問 ${i + 1} の選択肢 ${k + 1} を消す`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line text-muted"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {d.choices.length < MAX_CHOICES && (
                <button
                  type="button"
                  onClick={() => update(d.key, { choices: [...d.choices, ""] })}
                  className="min-h-11 self-start rounded-lg border border-dashed border-line px-4 text-sm font-bold text-muted hover:border-coral"
                >
                  ＋ 選択肢を追加
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {full ? (
        <p className="text-xs text-muted">質問は{MAX_QUESTIONS}つまでです。</p>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onChange([...drafts, { key: newKey(), kind: "free", text: "", choices: [] }])}
            className="min-h-11 self-start rounded-lg border border-dashed border-line px-4 text-sm font-bold text-muted hover:border-coral"
          >
            ＋ 質問を追加
          </button>
          {presets.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">よく使われる質問</span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.text}
                    type="button"
                    onClick={() => onChange([...drafts, { key: newKey(), kind: p.kind, text: p.text, choices: p.choices ? [...p.choices] : [] }])}
                    className="min-h-11 rounded-full border border-line bg-card px-3 text-left text-xs font-bold"
                  >
                    ＋ {p.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
