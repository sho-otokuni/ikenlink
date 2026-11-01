"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { deleteLink, fetchResults, fetchResultsByToken, setLinkPublic, type Response, type Results } from "@/lib/links";
import { QUESTION_COPY } from "@/lib/questions";
import type { FeedbackLink, Question } from "@/lib/types";

/** AI のまとめを出せるようになる、意見の数 */
const SUMMARY_MIN = 5;

/**
 * 届いた意見を見る画面。作った端末なら自分のものとして、管理用の URL（token あり）なら合言葉で読む
 */
export function LinkResults({ id, created, token }: { id: string; created: boolean; token: string | null }) {
  const router = useRouter();
  // undefined＝読み込み中／null＝見つからない（自分のものでない）
  const [data, setData] = useState<Results | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (token ? fetchResultsByToken(id, token) : fetchResults(id)).then((r) => {
      if (!alive) return;
      if (r.ok) setData(r.data);
      else setError(r.message);
    });
    return () => {
      alive = false;
    };
  }, [id, token]);

  if (error) return <p role="alert" className="text-sm font-bold text-coral">{error}</p>;
  if (data === undefined) return <div className="h-40 rounded-2xl bg-line" aria-busy />;
  if (data === null) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p>
          {token
            ? "このリンクは見つかりませんでした。管理用の URL が途中で切れていないか、確かめてください。"
            : "このリンクは見つかりませんでした。別の端末やブラウザで作ったときは、リンクを作ったときの「管理用の URL」から開いてください。"}
        </p>
        <Link href="/me" className="font-bold text-coral">自分のリンクへ</Link>
      </div>
    );
  }

  const { link, responses, adminToken, isPublic } = data;
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

      {token && (
        <p className="rounded-xl bg-leaf-tint px-3 py-2 text-sm leading-relaxed">管理用の URL で開いています。この URL は、ほかの人に見せないでください。</p>
      )}

      <ShareCard link={link} highlight={created || count === 0} />

      {adminToken && <AdminUrlCard id={link.id} token={adminToken} highlight={created} />}

      {isPublic !== null && <PublicToggle id={link.id} initial={isPublic} />}

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

      {/* 消せるのは、作った端末で開いたときだけ */}
      {!token && (
        <button type="button" onClick={remove} className="min-h-11 self-center rounded-full px-4 text-sm text-muted hover:text-coral">
          このリンクを消す
        </button>
      )}
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

/** 意見募集中の一覧に載せる・外す（作った端末で開いたときだけ） */
function PublicToggle({ id, initial }: { id: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    const r = await setLinkPublic(id, !on);
    setBusy(false);
    if (!r.ok) return setError(r.message);
    setOn(!on);
  }

  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 flex-col gap-0.5">
          <h2 className="font-bold">意見募集中の一覧</h2>
          <p className="text-sm text-muted">{on ? "載せています。ほかの作り手が見て、答えてくれることがあります。" : "載せていません。リンクを知っている人だけが答えられます。"}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="意見募集中の一覧に載せる"
          onClick={toggle}
          disabled={busy}
          className={`relative h-8 w-14 shrink-0 rounded-full transition disabled:opacity-50 ${on ? "bg-leaf" : "bg-line"}`}
        >
          <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-7" : "left-1"}`} />
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm font-bold text-coral">
          {error}
        </p>
      )}
    </section>
  );
}

/** 意見を見るための、自分専用の URL。ほかの端末やブラウザからも、これで見られる */
function AdminUrlCard({ id, token, highlight }: { id: string; token: string; highlight: boolean }) {
  const origin = useOrigin();
  const [copied, setCopied] = useState(false);
  const adminUrl = `${origin}/me/${id}?k=${token}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(adminUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("この URL をコピーして、メモやブックマークに残してください", adminUrl);
    }
  }

  return (
    <section className={`flex flex-col gap-3 rounded-2xl border p-4 ${highlight ? "border-peach bg-peach-tint" : "border-line bg-card"}`}>
      <h2 className="font-bold">意見を見るための、自分専用の URL</h2>
      <p className="text-sm leading-relaxed">
        いまのブラウザ以外（ほかのスマホ、パソコン、X のアプリの外など）から意見を見るときに使います。メモやブックマークに残しておいてください。
        <strong>この URL を知っている人は意見を読めるので、人には送らないでください。</strong>
      </p>
      <button type="button" onClick={copy} className="min-h-11 rounded-full border border-line bg-card px-4 text-sm font-bold">
        {copied ? "コピーしました" : "自分専用の URL をコピー"}
      </button>
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
