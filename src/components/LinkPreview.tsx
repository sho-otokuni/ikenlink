"use client";

import { useState } from "react";

import { LinkIcon } from "@/components/icons";
import { KindLabel } from "@/components/KindLabel";
import { formatDay, questionChoices, questionLabel } from "@/lib/questions";
import type { LinkKind, Question } from "@/lib/types";

/** multiple＝選択式で複数選べる */
export type PreviewQuestion = { label: string; choices?: string[]; multiple?: boolean };

/** 保存してある質問を、プレビューで見せる形にする */
export function toPreviewQuestions(questions: Question[]): PreviewQuestion[] {
  return questions.map((q) => ({ label: questionLabel(q), choices: questionChoices(q), multiple: q.kind === "multi" }));
}

/**
 * プレビュー：答える人にどう見えるか。
 * ふだんは上のほうだけ。「全体を見る」を押したときだけ、答える画面の全部（画像・リンク・すべての質問）を出す
 */
export function LinkPreview({
  kind,
  title,
  images,
  captions = [],
  tagline,
  urls,
  makerName,
  closesAt,
  questions,
  className = "",
  sticky = false,
  startFull = false,
}: {
  kind: LinkKind;
  title: string;
  images: string[];
  /** 画像それぞれのタイトル（images と同じ並び） */
  captions?: string[];
  tagline: string;
  urls: string[];
  makerName: string;
  closesAt: Date | null;
  questions: PreviewQuestion[];
  className?: string;
  /** 画面に貼り付ける（作る画面の右側で使う）。全体を出しているときは長くなるので貼り付けない */
  sticky?: boolean;
  /** 最初から全体を出す（募集したあとの画面） */
  startFull?: boolean;
}) {
  const [full, setFull] = useState(startFull);
  const shownQuestions = full ? questions : questions.slice(0, 2);
  const links = urls.map((u) => u.trim()).filter(Boolean);
  return (
    <aside aria-label="答える人からの見え方" className={`${sticky && !full ? "sticky top-6" : ""} flex flex-col gap-2.5 ${className}`}>
      <span className="text-[13px] font-bold text-muted">プレビュー</span>
      <div className="flex flex-col items-start gap-2 rounded-lg border border-line bg-card p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
        <span className="text-[11px] text-muted">
          {makerName.trim() || "あなた"}さんが意見を募集しています{closesAt ? ` · ${formatDay(closesAt).replace(/（.）/, "")}まで` : ""}
        </span>
        <KindLabel link={{ kind }} />
        <b className={`font-round text-[19px] leading-snug ${title.trim() ? "" : "text-muted"}`}>{title.trim() || "タイトル"}</b>
        {(full ? images : images.slice(0, 1)).map((src, i) => (
          <figure key={src.slice(-40) + i} className="flex w-full flex-col gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- 作る画面では端末の中の画像（data URL）なので、Next.js の画像変換は使えない */}
            <img src={src} alt={captions[i]?.trim() || ""} className="max-h-48 w-full rounded-lg border border-line object-contain" />
            {captions[i]?.trim() && <figcaption className="text-center text-xs text-muted">{captions[i].trim()}</figcaption>}
          </figure>
        ))}
        {tagline.trim() && <p className={`whitespace-pre-wrap text-[13px] leading-relaxed ${full ? "" : "line-clamp-4"}`}>{tagline.trim()}</p>}
        {full &&
          links.map((u, i) => (
            <span key={`${i}-${u}`} className="flex w-full items-center gap-2 rounded-lg border-2 border-coral bg-coral-tint px-3 py-2">
              <LinkIcon />
              <span className="flex min-w-0 flex-col">
                <b className="text-xs">リンク</b>
                <span className="truncate text-[11px] underline underline-offset-2">{u.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
              </span>
            </span>
          ))}
        {shownQuestions.map((q, i) => (
          <div key={q.label + i} className="flex w-full flex-col gap-1.5">
            <b className="text-[13px]">
              {q.label}
              {q.multiple && <span className="ml-1 text-[11px] font-normal text-muted">（複数選べます）</span>}
            </b>
            {q.choices ? (
              <div className="flex flex-wrap gap-1.5">
                {q.choices.map((c) => (
                  <span key={c} className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold">
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <div className="h-12 rounded-lg border border-line" />
            )}
          </div>
        ))}
        {!full && questions.length > 2 && <span className="text-xs text-muted">…ほか {questions.length - 2} 問</span>}
        {full && <span className="flex min-h-10 w-full items-center justify-center rounded-lg bg-coral text-sm font-bold text-night opacity-60">意見を送る</span>}
      </div>
      <button type="button" onClick={() => setFull((v) => !v)} aria-expanded={full} className="min-h-11 self-center rounded-lg border border-line bg-card px-5 text-sm font-bold hover:border-coral">
        {full ? "閉じる" : "全体を見る"}
      </button>
    </aside>
  );
}
