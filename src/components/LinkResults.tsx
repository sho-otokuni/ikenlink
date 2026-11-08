"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { CalendarIcon } from "@/components/icons";
import { KindLabel } from "@/components/KindLabel";
import { LinkPreview, toPreviewQuestions } from "@/components/LinkPreview";
import { getAccount } from "@/lib/auth";
import { deleteLink, fetchResults, fetchResultsByToken, setLinkDeadline, setLinkPublic, type Response, type Results } from "@/lib/links";
import { answerValues, DEADLINES, deadlineAfter, deadlineOn, formatDay, isClosed, questionChoices, questionLabel, remaining } from "@/lib/questions";
import type { FeedbackLink, Question } from "@/lib/types";

/**
 * 届いた意見を見る画面。作った端末なら自分のものとして、自分専用の URL（token あり）なら合言葉で読む
 */
export function LinkResults({ id, created, saved = false, token }: { id: string; created: boolean; saved?: boolean; token: string | null }) {
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
  if (data === undefined) return <div className="h-40 rounded-lg bg-line" aria-busy />;
  if (data === null) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p>
          {token
            ? "この募集は見つかりませんでした。自分専用の URL が途中で切れていないか、確かめてください。"
            : "この募集は見つかりませんでした。別の端末やブラウザで作ったときは、募集を作ったときの「自分専用の URL」から開いてください。"}
        </p>
        <Link href="/me" className="font-bold text-coral">自分のリンクへ</Link>
      </div>
    );
  }

  const { link, responses, adminToken, isPublic } = data;
  const count = responses.length;

  async function remove() {
    if (!window.confirm("この募集を消しますか？届いた意見も消え、元に戻せません。")) return;
    const r = await deleteLink(id);
    if (!r.ok) return setError(r.message);
    router.push("/me");
  }

  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      {(created || saved) && <p className="self-start rounded-full bg-leaf-tint px-3 py-1 text-sm font-bold">{created ? "募集を始めました！" : "変更を保存しました"}</p>}
      <div className="flex items-center gap-2.5 lg:gap-4">
        {link.images[0] && (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line lg:h-[72px] lg:w-[72px]">
            <Image src={link.images[0]} alt="" fill sizes="72px" className="object-cover" />
          </div>
        )}
        <div className="flex flex-1 flex-col items-start gap-0.5 lg:gap-1">
          <KindLabel link={link} />
          <h1 className="font-round text-lg font-bold leading-snug lg:text-[28px]">{link.title}</h1>
        </div>
        {/* 直せるのは、作った端末（またはアカウント）で開いたときだけ */}
        {!token && (
          <Link href={`/me/${link.id}/edit`} className="flex min-h-11 shrink-0 items-center rounded-lg border border-line bg-card px-3.5 text-xs font-bold hover:border-coral">
            編集する
          </Link>
        )}
        <span className="flex items-baseline gap-1 whitespace-nowrap">
          <span className="font-round text-[26px] font-bold leading-none tabular-nums lg:text-[40px]">{count}</span>
          <span className="text-xs text-muted lg:text-sm">件の意見</span>
        </span>
      </div>

      {token && (
        <p className="rounded-lg bg-leaf-tint px-3 py-2 text-sm leading-relaxed">自分専用の URL で開いています。この URL は、ほかの人に見せないでください。</p>
      )}

      {/*
        パソコンでは、左に届いた意見、右の列に「送る・設定・自分専用の URL」を置く。
        スマホでは右の列の入れ物（contents）を消して、order で「送る → 設定 → 意見 → 自分専用の URL」の順に並べる
      */}
      <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-6 xl:grid-cols-[1fr_400px]">
        <div className="order-3 flex flex-col gap-3.5 lg:order-none lg:col-start-1 lg:row-start-1 lg:gap-3">
          {count > 0 ? (
            <ResponsesView questions={link.questions} responses={responses} />
          ) : (
            <section className="flex flex-col gap-1 lg:items-start lg:gap-2 lg:rounded-lg lg:border lg:border-dashed lg:border-line lg:p-5">
              <b className="text-sm lg:font-round lg:text-lg">まだ意見は届いていません</b>
              <p className="text-sm leading-relaxed text-muted">リンクを X や友だちに送ってみましょう。</p>
              <Link href={`/l/${link.id}`} className="flex min-h-11 items-center text-xs font-bold text-coral lg:text-sm">
                答える画面を見てみる ›
              </Link>
            </section>
          )}
          {/* 募集した中身（何を見せて、何を聞いたか）。パソコンでは左の列の下、スマホでは一番下の近くに出る */}
          <LinkSummary link={link} />
        </div>

        <aside className="contents lg:col-start-2 lg:row-start-1 lg:flex lg:flex-col lg:gap-3">
          <div className="order-1 lg:order-none">
            <ShareCard link={link} highlight={created || count === 0} />
          </div>
          <div className="order-2 lg:order-none">
            {isPublic !== null ? (
              <SettingsCard id={link.id} initialPublic={isPublic} initialClosesAt={link.closesAt} />
            ) : (
              <p className="text-sm text-muted">{deadlineText(link.closesAt)}</p>
            )}
          </div>
          {adminToken && (
            <div className="order-4 lg:order-none">
              <AdminUrlCard id={link.id} token={adminToken} highlight={created} />
            </div>
          )}

      <div className="order-5 flex items-center justify-between lg:order-none">
        <Link href={`/l/${link.id}`} className="flex min-h-11 items-center text-xs font-bold text-muted hover:text-ink">
          答える画面を見てみる ›
        </Link>
        {/* 消せるのは、作った端末で開いたときだけ */}
        {!token && (
          <button type="button" onClick={remove} className="min-h-11 px-2 text-xs text-muted hover:text-coral">
            この募集を消す
          </button>
        )}
      </div>
        </aside>
      </div>
    </div>
  );
}

/** 募集の中身を、答える人に見える形（プレビュー）で出す */
function LinkSummary({ link }: { link: FeedbackLink }) {
  return (
    <LinkPreview
      kind={link.kind}
      title={link.title}
      images={link.images}
      captions={link.imageCaptions}
      tagline={link.tagline ?? ""}
      urls={link.urls}
      makerName={link.makerName}
      closesAt={link.closesAt ? new Date(link.closesAt) : null}
      questions={toPreviewQuestions(link.questions)}
      startFull
    />
  );
}

function deadlineText(closesAt: string | null) {
  if (!closesAt) return "締め切りなし";
  if (isClosed(closesAt)) return `${formatDay(closesAt)}に締め切りました`;
  return `${formatDay(closesAt)}まで · ${remaining(closesAt)?.replace("まで", "")}`;
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
  const text = `「${link.title}」について、意見を募集しています。30秒・登録なしで答えられます！`;
  const xUrl = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
  // LINE の送る画面（スマホでは LINE のアプリが開き、送る相手を選べる）
  const lineUrl = `https://line.me/R/share?text=${encodeURIComponent(`${text}\n${shareUrl}`)}`;

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
    <section className={`flex flex-col gap-2 rounded-lg border p-3 ${highlight ? "border-coral bg-card" : "border-line bg-card"}`}>
      <h2 className="text-sm font-bold">このリンクを送って、意見を集める</h2>
      <p className="break-all rounded-lg bg-card px-2.5 py-1.5 font-mono text-xs">{shareUrl}</p>
      <button type="button" onClick={copy} className="min-h-11 rounded-lg bg-coral px-3 text-[13px] font-bold text-night">
        {copied ? "コピーしました" : "リンクをコピー"}
      </button>
      <div className="flex gap-2">
        <a href={xUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-night px-3 text-[13px] font-bold text-white">
          X に投稿する
        </a>
        <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-line-brand px-3 text-[13px] font-bold text-white">
          LINE で送る
        </a>
      </div>
    </section>
  );
}

/** 公開範囲と締め切り（作った端末で開いたときだけ変えられる） */
function SettingsCard({ id, initialPublic, initialClosesAt }: { id: string; initialPublic: boolean; initialClosesAt: string | null }) {
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [closesAt, setClosesAt] = useState(initialClosesAt);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closed = isClosed(closesAt);

  async function changePublic(next: boolean) {
    if (next === isPublic || busy) return;
    setBusy(true);
    setError(null);
    const r = await setLinkPublic(id, next);
    setBusy(false);
    if (!r.ok) return setError(r.message);
    setIsPublic(next);
  }

  async function changeDeadline(next: Date | null) {
    setBusy(true);
    setError(null);
    const iso = next?.toISOString() ?? null;
    const r = await setLinkDeadline(id, iso);
    setBusy(false);
    if (!r.ok) return setError(r.message);
    setClosesAt(iso);
    setEditing(false);
  }

  function closeNow() {
    if (!window.confirm("いま締め切りますか？答えられなくなり、一覧からも外れます。あとから再開できます。")) return;
    changeDeadline(new Date());
  }

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-line bg-card p-3">
      <h2 className="text-sm font-bold">公開範囲</h2>
      <div role="radiogroup" aria-label="公開範囲" className="flex rounded-lg bg-line/60 p-[3px]">
        {[
          { value: true, label: "公開（誰でも）" },
          { value: false, label: "リンクを知っている人だけ" },
        ].map((o) => (
          <button
            key={o.label}
            type="button"
            role="radio"
            aria-checked={isPublic === o.value}
            disabled={busy}
            onClick={() => changePublic(o.value)}
            className={`min-h-10 flex-1 rounded-md text-xs font-bold ${isPublic === o.value ? "bg-card shadow-sm" : "text-muted"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-muted">
        {isPublic
          ? closed
            ? "締め切ったので、いまは一覧に並んでいません。"
            : "「みんなの募集」の一覧に並んでいます。誰でも回答できます。"
          : "一覧には並びません。リンクを送った相手だけが回答できます。"}
      </p>

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2">
        <span className="flex min-w-full flex-col">
          <b className="text-sm">締め切り</b>
          <span className={`text-xs ${closed ? "font-bold text-coral" : "text-muted"}`}>{deadlineText(closesAt)}</span>
        </span>
        <button type="button" onClick={() => setEditing((v) => !v)} disabled={busy} className="min-h-11 rounded-lg border border-line px-3.5 text-xs font-bold">
          {closed ? "再開する" : "変える"}
        </button>
        {!closed && (
          <button type="button" onClick={closeNow} disabled={busy} className="min-h-11 rounded-lg border border-line px-3.5 text-xs font-bold">
            いま締め切る
          </button>
        )}
      </div>
      {editing && <DeadlinePicker onPick={changeDeadline} busy={busy} />}
      {error && <p role="alert" className="text-sm font-bold text-coral">{error}</p>}
    </section>
  );
}

/** 締め切りの選び直し（今日から数える） */
function DeadlinePicker({ onPick, busy }: { onPick: (d: Date | null) => void; busy: boolean }) {
  const [date, setDate] = useState("");
  const min = new Date().toISOString().slice(0, 10);
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-bg p-2.5">
      <div className="flex flex-wrap gap-1.5">
        {DEADLINES.map((d) => (
          <button
            key={d.id}
            type="button"
            disabled={busy}
            onClick={() => onPick(d.days ? deadlineAfter(d.days) : null)}
            className="min-h-11 rounded-lg border border-line bg-card px-3.5 text-sm font-bold"
          >
            {d.days ? `今日から${d.label}` : "締め切りなし"}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <CalendarIcon />
        <input type="date" value={date} min={min} onChange={(e) => setDate(e.target.value)} aria-label="締め切りの日付" className="min-h-11 flex-1 rounded-lg border border-line bg-card px-3 text-base" />
        <button type="button" disabled={!date || busy} onClick={() => onPick(deadlineOn(date))} className="min-h-11 rounded-lg bg-coral px-4 text-sm font-bold text-night disabled:opacity-40">
          この日にする
        </button>
      </div>
    </div>
  );
}

/** 意見を見るための、自分専用の URL。ほかの端末やブラウザからも、これで見られる */
function AdminUrlCard({ id, token, highlight }: { id: string; token: string; highlight: boolean }) {
  const origin = useOrigin();
  const [copied, setCopied] = useState(false);
  const adminUrl = `${origin}/me/${id}?k=${token}`;
  // アカウントを作っている人は、自分のリンクにいつでも出るので、この URL を残しておかなくてよい
  const [member, setMember] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    getAccount().then((a) => alive && setMember(a.state === "member"));
    return () => {
      alive = false;
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(adminUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("この URL をコピーして、メモやブックマークに残してください", adminUrl);
    }
  }

  if (member === null) return null;

  if (member) {
    return (
      <section className="flex flex-col gap-1.5 rounded-lg border border-leaf bg-card p-3">
        <h2 className="text-sm font-bold">この募集は、アカウントに保存されています</h2>
        <p className="text-xs leading-relaxed">
          ログインしているので、この募集は
          <Link href="/me" className="font-bold underline underline-offset-2">
            自分のリンク
          </Link>
          にいつでも出ます。ほかのスマホやパソコンでも、ログインすれば見られます。下の URL を残しておく必要はありません。
        </p>
        <details className="text-xs">
          <summary className="flex min-h-11 cursor-pointer items-center font-bold text-muted">ログインせずに見る、自分専用の URL</summary>
          <div className="flex flex-col gap-1.5">
            <p className="leading-relaxed">
              ログインしないで意見を見たいときに使えます。<strong>人には送らないでください。</strong>
            </p>
            <button type="button" onClick={copy} className="min-h-11 rounded-lg border border-line bg-card px-4 text-[13px] font-bold">
              {copied ? "コピーしました" : "自分専用の URL をコピー"}
            </button>
          </div>
        </details>
      </section>
    );
  }

  return (
    <section className={`flex flex-col gap-1.5 rounded-lg border p-3 ${highlight ? "border-peach bg-card" : "border-line bg-card"}`}>
      <h2 className="text-sm font-bold">意見を見るための、自分専用の URL</h2>
      <p className="text-xs leading-relaxed">
        ほかの端末やブラウザから意見を見るときに使います。メモやブックマークに残しておいてください。<strong>人には送らないでください。</strong>
      </p>
      <button type="button" onClick={copy} className="min-h-11 rounded-lg border border-line bg-card px-4 text-[13px] font-bold">
        {copied ? "コピーしました" : "自分専用の URL をコピー"}
      </button>
      <p className="text-xs leading-relaxed text-muted">
        <Link href="/me" className="font-bold text-coral underline-offset-2 hover:underline">
          アカウントを作る
        </Link>
        と、この URL を残さなくても、自分のリンクからいつでも見られます。
      </p>
    </section>
  );
}

/**
 * 届いた意見の見え方を切り替える。
 * 質問ごと：質問ごとに、みんなの答えをまとめて見る／回答者ごと：1人の答えを、質問の順にまとめて見る（名前は出さず、届いた順の番号で呼ぶ）
 */
function ResponsesView({ questions, responses }: { questions: Question[]; responses: Response[] }) {
  const [view, setView] = useState<"question" | "person">("question");
  const tab = (id: "question" | "person", label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={view === id}
      onClick={() => setView(id)}
      className={`min-h-10 flex-1 rounded-md text-xs font-bold lg:text-sm ${view === id ? "bg-card shadow-sm" : "text-muted"}`}
    >
      {label}
    </button>
  );
  return (
    <>
      <div role="tablist" aria-label="意見の見え方" className="flex gap-1 rounded-lg bg-line p-1 lg:max-w-sm">
        {tab("question", "質問ごと")}
        {tab("person", "回答者ごと")}
      </div>
      {view === "question"
        ? questions.map((q) => <QuestionResult key={q.id} question={q} responses={responses} />)
        : responses.map((r, i) => <PersonResult key={r.id} number={responses.length - i} response={r} questions={questions} />)}
    </>
  );
}

/** 回答者1人分の答え。新しい順に並べ、番号は届いた順（いちばん最初が 回答者1） */
function PersonResult({ number, response, questions }: { number: number; response: Response; questions: Question[] }) {
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-line bg-card px-3 py-3 lg:px-4 lg:py-3.5">
      <h2 className="flex items-baseline gap-2 text-sm font-bold lg:text-base">
        回答者 {number}
        <span className="text-[11px] font-normal text-muted">{new Date(response.createdAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
      </h2>
      <dl className="flex flex-col gap-2">
        {questions.map((q) => {
          // 複数選べる質問は「ホーム、設定」のように並べる
          const value = answerValues(q, response.answers[q.id]).join("、");
          return (
            <div key={q.id} className="flex flex-col gap-0.5 border-t border-line pt-2 first:border-t-0 first:pt-0">
              <dt className="text-xs text-muted">{questionLabel(q)}</dt>
              <dd className={`whitespace-pre-wrap text-[13px] leading-relaxed ${value ? "" : "text-muted"}`}>{value || "（回答なし）"}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

function QuestionResult({ question, responses }: { question: Question; responses: Response[] }) {
  const label = questionLabel(question);
  const choices = questionChoices(question);
  const multiple = question.kind === "multi";
  // 1人分の答えを、選んだもの・書いたものの並びにする（新しい順。前の版の選択肢は、いまの選択肢に合わせる）
  const perPerson = responses.map((r) => answerValues(question, r.answers[question.id])).filter((v) => v.length > 0);
  const values = perPerson.flat();

  return (
    <section className="flex flex-col gap-1.5 lg:gap-2 lg:rounded-lg lg:border lg:border-line lg:bg-card lg:px-4 lg:py-3.5">
      <h2 className="text-sm font-bold leading-snug lg:text-base">
        {label}
        <span className="ml-1.5 text-[11px] font-normal text-muted">
          {perPerson.length}件{multiple && "（複数選べる質問。割合は回答した人数に対して）"}
        </span>
      </h2>
      {choices ? (
        <div className="flex flex-col gap-1.5">
          {choices.map((c) => {
            // 何人が選んだか。複数選べる質問は1人が何個も選ぶので、割合は回答した人数で割る
            const n = perPerson.filter((v) => v.includes(c)).length;
            const pct = perPerson.length ? Math.round((n / perPerson.length) * 100) : 0;
            return (
              <div key={c} className="flex items-center gap-2 text-xs">
                <span title={c} className="w-24 shrink-0 truncate lg:w-32">{c}</span>
                <div className="h-[18px] flex-1 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-coral" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right tabular-nums text-muted">{n}件</span>
              </div>
            );
          })}
        </div>
      ) : values.length > 0 ? (
        <ul className="flex flex-col gap-1.5 lg:grid lg:grid-cols-2 lg:gap-2 2xl:grid-cols-3">
          {values.map((v, i) => (
            <li key={i} className="whitespace-pre-wrap rounded-lg border border-line bg-card px-2.5 py-1.5 text-[13px] leading-relaxed">
              {v}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted">まだありません</p>
      )}
    </section>
  );
}
