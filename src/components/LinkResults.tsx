"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { deleteLink, fetchResults, type Response } from "@/lib/links";
import { QUESTION_COPY } from "@/lib/questions";
import type { FeedbackLink, Question } from "@/lib/types";

/** AI のまとめを出せるようになる、意見の数 */
const SUMMARY_MIN = 5;

export function LinkResults({ id, created }: { id: string; created: boolean }) {
  const router = useRouter();
  // undefined＝読み込み中／null＝見つからない（自分のものでない）
  const [data, setData] = useState<{ link: FeedbackLink; responses: Response[] } | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchResults(id).then((r) => {
      if (!alive) return;
      if (r.ok) setData(r.data);
      else setError(r.message);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  if (error) return <p role="alert" className="text-sm font-bold text-coral">{error}</p>;
  if (data === undefined) return <div className="h-40 rounded-2xl bg-line" aria-busy />;
  if (data === null) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p>このリンクは見つかりませんでした。消したか、別の端末やブラウザで作ったものかもしれません。</p>
        <Link href="/me" className="font-bold text-coral">自分のリンクへ</Link>
      </div>
    );
  }

  const { link, responses } = data;
  const count = responses.length;

  async function remove() {
    if (!window.confirm("このリンクを消しますか？届いた意見も消え、元に戻せません。")) return;
    const r = await deleteLink(id);
    if (!r.ok) return setError(r.message);
    router.push("/me");
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        {created && <p className="mb-2 self-start rounded-full bg-leaf-tint px-3 py-1 text-sm font-bold">リンクができました！</p>}
        <h1 className="font-round text-2xl font-bold">{link.title}</h1>
        <p className="text-sm text-muted">届いた意見 {count}件</p>
      </div>

      <ShareCard link={link} highlight={created || count === 0} />

      <section className="flex flex-col gap-3 rounded-2xl bg-peach-tint p-4">
        <h2 className="font-bold">AI のまとめ</h2>
        <p className="text-sm leading-relaxed">
          {count >= SUMMARY_MIN
            ? "多かった声・よかった点・直すと良さそうな順に、AI がまとめます（準備中）。"
            : `意見が${SUMMARY_MIN}件たまると、AI がまとめます。あと${SUMMARY_MIN - count}件です。`}
        </p>
      </section>

      {count > 0 ? (
        link.questions.map((q) => <QuestionResult key={q.id} question={q} responses={responses} />)
      ) : (
        <p className="text-sm leading-relaxed text-muted">まだ意見は届いていません。上のリンクを X や友だちに送ってみましょう。</p>
      )}

      <button type="button" onClick={remove} className="min-h-11 self-center rounded-full px-4 text-sm text-muted hover:text-coral">
        このリンクを消す
      </button>
    </div>
  );
}

/** リンクの URL は、開いている場所（手元・公開先）に合わせて作る */
function useOrigin() {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
}

function ShareCard({ link, highlight }: { link: FeedbackLink; highlight: boolean }) {
  const origin = useOrigin();
  const [copied, setCopied] = useState(false);
  const shareUrl = `${origin}/l/${link.id}`;
  const text = `「${link.title}」を作りました。30秒・登録なしで答えられるので、意見をもらえるとうれしいです！`;
  const xUrl = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}&hashtags=${encodeURIComponent("個人開発")}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("このリンクをコピーしてください", shareUrl);
    }
  }

  return (
    <section className={`flex flex-col gap-3 rounded-2xl border p-4 ${highlight ? "border-coral bg-coral-tint" : "border-line bg-card"}`}>
      <h2 className="font-bold">このリンクを送って、意見を集める</h2>
      <p className="break-all rounded-xl bg-card px-3 py-2 font-mono text-sm">{shareUrl}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copy} className="min-h-11 flex-1 rounded-full bg-coral px-4 text-sm font-bold text-night">
          {copied ? "コピーしました" : "リンクをコピー"}
        </button>
        <a href={xUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-night px-4 text-sm font-bold text-white">
          X に投稿する
        </a>
      </div>
      <Link href={`/l/${link.id}`} className="self-start text-sm font-bold text-muted underline-offset-4 hover:underline">
        答える画面を自分で見てみる ›
      </Link>
    </section>
  );
}

function QuestionResult({ question, responses }: { question: Question; responses: Response[] }) {
  const copy = QUESTION_COPY[question.kind];
  const label = question.kind === "free" ? question.text ?? "" : copy.label;
  // 新しい順に並んでいる
  const values = responses.map((r) => (r.answers[question.id] ?? "").trim()).filter(Boolean);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-bold leading-snug">
        {label}
        <span className="ml-2 text-xs font-normal text-muted">{values.length}件</span>
      </h2>
      {copy.choices ? (
        <div className="flex flex-col gap-2">
          {copy.choices.map((c) => {
            const n = values.filter((v) => v === c).length;
            const pct = values.length ? Math.round((n / values.length) * 100) : 0;
            return (
              <div key={c} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0">{c}</span>
                <div className="h-6 flex-1 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-coral" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-12 shrink-0 text-right tabular-nums text-muted">{n}件</span>
              </div>
            );
          })}
        </div>
      ) : values.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {values.map((v, i) => (
            <li key={i} className="rounded-xl border border-line bg-card px-3 py-2 text-sm leading-relaxed">
              {v}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">まだありません</p>
      )}
    </section>
  );
}
