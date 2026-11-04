"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { CalendarIcon } from "@/components/icons";
import { KindLabel } from "@/components/KindLabel";
import { getAccount, setDisplayName } from "@/lib/auth";
import { shrinkImage } from "@/lib/image";
import { createLink, updateLink } from "@/lib/links";
import { DEADLINES, deadlineAfter, deadlineOn, formatDay, LINK_KINDS, QUESTION_COPY, TEMPLATE_KINDS } from "@/lib/questions";
import type { FeedbackLink, LinkKind, Question, QuestionKind } from "@/lib/types";

const MAX_IMAGES = 4;
const MAX_FREE = 2;
const MAX_URLS = 5;

/**
 * 今日の日付（yyyy-mm-dd）。締め切りを数える基準で、日付を選ぶときのいちばん早い日。
 * 時刻はページを開いた人の端末で読む（サーバーで前もって作る画面では null）
 */
function useToday() {
  return useSyncExternalStore(
    () => () => {},
    () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    },
    () => null,
  );
}

/** yyyy-mm-dd（端末の時刻で） */
function dayString(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 直すときに渡す、いまの中身 */
export type EditTarget = { link: FeedbackLink; isPublic: boolean; responseCount: number };

/**
 * 意見を募集する。画像1枚だけでも、URL だけでも始められる。
 * editing を渡すと、作った募集を直す画面になる（意見が届いたあとは、質問だけは変えられない）
 */
export function NewLinkForm({ editing }: { editing?: EditTarget }) {
  const router = useRouter();
  const start = editing?.link;
  const [kind, setKind] = useState<LinkKind>(start?.kind ?? "idea");
  const [title, setTitle] = useState(start?.title ?? "");
  const [images, setImages] = useState<string[]>(start?.images ?? []);
  const [tagline, setTagline] = useState(start?.tagline ?? "");
  const [urls, setUrls] = useState<string[]>(start?.urls.length ? start.urls : [""]);
  const [kinds, setKinds] = useState<QuestionKind[]>(
    start ? start.questions.map((q) => q.kind).filter((k) => TEMPLATE_KINDS.some((t) => t.kind === k)) : TEMPLATE_KINDS.filter((t) => t.on).map((t) => t.kind),
  );
  const [freeQuestions, setFreeQuestions] = useState<string[]>(start ? start.questions.filter((q) => q.kind === "free").map((q) => q.text ?? "") : []);
  // 意見が届いたあとは、答えと質問がずれないよう、質問は変えられない
  const questionsLocked = (editing?.responseCount ?? 0) > 0;
  // 締め切り：DEADLINES の id か、"date"（日付を選ぶ）。直すときは、いまの締め切りの日付から始める
  const [deadline, setDeadline] = useState(start ? (start.closesAt ? "date" : "none") : "1w");
  const [deadlineDate, setDeadlineDate] = useState(start?.closesAt ? dayString(start.closesAt) : "");
  // 公開すると、意見募集中の一覧に並び、だれでも答えられる
  const [isPublic, setIsPublic] = useState(editing?.isPublic ?? true);
  const [makerName, setMakerName] = useState(start?.makerName ?? "");
  // プロフィールに保存してある「表示する名前」（なければ空。初めて募集したときに保存する）
  const [profileName, setProfileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const today = useToday();

  // プロフィールの名前を、表示する名前の欄に入れておく（もう何か書いてあれば上書きしない）
  useEffect(() => {
    let alive = true;
    getAccount().then((a) => {
      if (!alive) return;
      const name = a.state === "none" ? "" : a.displayName;
      setProfileName(name);
      if (name) setMakerName((v) => v || name);
    });
    return () => {
      alive = false;
    };
  }, []);

  const questionCount = questionsLocked && editing ? editing.link.questions.length : kinds.length + freeQuestions.filter((q) => q.trim()).length;
  const canSubmit = title.trim() !== "" && makerName.trim() !== "" && questionCount > 0 && !busy;

  const closesAt = (() => {
    if (deadline === "date") return deadlineDate ? deadlineOn(deadlineDate) : null;
    const days = DEADLINES.find((d) => d.id === deadline)?.days;
    return days && today ? deadlineAfter(days, deadlineOn(today)) : null;
  })();

  async function addImages(files: FileList | null) {
    if (!files) return;
    const room = MAX_IMAGES - images.length;
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, room);
    const shrunk = await Promise.all(picked.map((f) => shrinkImage(f)));
    setImages((list) => [...list, ...shrunk].slice(0, MAX_IMAGES));
  }

  function toggleKind(k: QuestionKind) {
    setKinds((list) => (list.includes(k) ? list.filter((x) => x !== k) : [...list, k]));
  }

  async function submit() {
    setError(null);
    if (!canSubmit) return;
    const cleanUrls = urls.map((u) => u.trim()).filter(Boolean);
    if (cleanUrls.some((u) => !/^https?:\/\/\S+$/.test(u))) return setError("URL は https:// から始まる形で入れてください");
    if (deadline === "date" && !deadlineDate) return setError("締め切りの日付を選んでください");
    setBusy(true);
    // 並びは型の順、自由な質問は最後（直すときに質問を変えられないなら、そのまま）
    const questions: Question[] | null = questionsLocked ? null : [
      ...TEMPLATE_KINDS.filter((t) => kinds.includes(t.kind)).map((t, i) => ({ id: `q${i + 1}`, kind: t.kind })),
      ...freeQuestions
        .map((text) => text.trim())
        .filter(Boolean)
        .map((text, i) => ({ id: `f${i + 1}`, kind: "free" as const, text })),
    ];
    const draft = {
      kind,
      title: title.trim(),
      tagline: tagline.trim() || null,
      urls: cleanUrls,
      images,
      makerName: makerName.trim(),
      closesAt: closesAt?.toISOString() ?? null,
      isPublic,
    };
    if (editing) {
      const saved = await updateLink(editing.link.id, { ...draft, questions }, editing.link.images);
      if (!saved.ok) {
        setBusy(false);
        return setError(saved.message);
      }
      setBusy(false);
      router.push(`/me/${editing.link.id}?saved=1`);
      return;
    }
    const r = await createLink({ ...draft, questions: questions ?? [] });
    if (!r.ok) {
      setBusy(false);
      return setError(r.message);
    }
    // プロフィールに名前がまだなければ、いま使った名前を保存しておく（次からは自動で入る）。失敗しても募集はできている
    if (!profileName) await setDisplayName(makerName);
    router.push(`/me/${r.data}?created=1`);
  }

  const preview = { kind, title, images, tagline, makerName, closesAt, kinds, freeQuestions };

  return (
    <div className="mt-4 lg:mt-6 lg:grid lg:grid-cols-[1fr_400px] lg:items-start lg:gap-12">
    <div className="flex flex-col gap-5 lg:gap-6">
      <Section title="見てほしいもの">
        <div role="radiogroup" aria-label="種類" className="flex flex-wrap gap-1.5">
          {LINK_KINDS.map((k) => (
            <button
              key={k.kind}
              type="button"
              role="radio"
              aria-checked={kind === k.kind}
              onClick={() => setKind(k.kind)}
              className={`min-h-11 rounded-full border px-3 text-xs font-bold ${kind === k.kind ? "border-coral bg-coral-tint" : "border-line bg-card"}`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <Field label="タイトル" required>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} placeholder="例：週末だけの古本カフェ、どう思う？" aria-label="タイトル" className={inputClass} />
        </Field>
        <Field label={`画像（${images.length}/${MAX_IMAGES}）`} note="スクショ、手書きのメモ、ラフでも OK">
          <div className="flex flex-wrap gap-2">
            {images.map((src, i) => (
              <div key={src.slice(-40) + i} className="relative h-24 w-24 overflow-hidden rounded-xl border border-line bg-card">
                {/* eslint-disable-next-line @next/next/no-img-element -- 端末の中の画像（data URL）なので、Next.js の画像変換は使えない */}
                <img src={src} alt={`画像 ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((list) => list.filter((_, k) => k !== i))}
                  aria-label={`画像 ${i + 1} を外す`}
                  className="absolute right-0 top-0 flex h-11 w-11 items-start justify-end p-1"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-night/70 text-sm text-white">×</span>
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <label
                // パソコンでは、画像をここへドラッグしても入れられる
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  addImages(e.dataTransfer.files);
                }}
                className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line text-xs text-muted hover:border-coral lg:min-w-48 lg:flex-1"
              >
                <span className="text-xl leading-none">＋</span>
                <span className="lg:hidden">画像</span>
                <span className="hidden lg:inline">ここに画像をドラッグ、または選ぶ</span>
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addImages(e.target.files)} />
              </label>
            )}
          </div>
        </Field>
        <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-2 lg:gap-3.5">
        <Field label="説明" note="（どんなものか、何に迷っているか）">
          <textarea
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            maxLength={400}
            rows={3}
            placeholder="例：駅前の空き店舗で、土日だけ古本カフェをやろうと思っています。値段の付け方に迷っています。"
            aria-label="説明"
            className="rounded-xl border border-line bg-card px-3 py-2.5 text-base leading-relaxed outline-none focus:border-coral"
          />
        </Field>
        <Field label="URL" note="（あれば。なくても大丈夫）">
          <div className="flex flex-col gap-2">
            {urls.map((u, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={u}
                  onChange={(e) => setUrls((list) => list.map((x, k) => (k === i ? e.target.value : x)))}
                  inputMode="url"
                  placeholder="https://"
                  aria-label={`URL ${i + 1}`}
                  className={`${inputClass} flex-1`}
                />
                {urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setUrls((list) => list.filter((_, k) => k !== i))}
                    aria-label={`URL ${i + 1} を消す`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-muted"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {urls.length < MAX_URLS && (
              <button
                type="button"
                onClick={() => setUrls((list) => [...list, ""])}
                className="min-h-11 self-start rounded-full border border-dashed border-line px-4 text-sm font-bold text-muted hover:border-coral"
              >
                ＋ URL を足す
              </button>
            )}
          </div>
        </Field>
        </div>
      </Section>

      <Section title="聞きたいこと">
        {questionsLocked && (
          <p className="rounded-xl bg-peach-tint px-3 py-2 text-xs leading-relaxed">
            もう意見が {editing?.responseCount} 件届いているので、質問は変えられません（届いた答えと質問がずれないように）。
          </p>
        )}
        <fieldset disabled={questionsLocked} className={`m-0 border-0 p-0 ${questionsLocked ? "opacity-50" : ""}`}>
        <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2">
          {TEMPLATE_KINDS.map((t) => {
            const on = kinds.includes(t.kind);
            return (
              <label key={t.kind} className={`flex min-h-11 cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 ${on ? "border-coral bg-coral-tint" : "border-line bg-card"}`}>
                <input type="checkbox" checked={on} onChange={() => toggleKind(t.kind)} className="mt-1 h-4 w-4 accent-[var(--coral)]" />
                <span className="flex flex-col">
                  <span className="text-sm font-bold">{QUESTION_COPY[t.kind].label}</span>
                  <span className="text-xs text-muted">{QUESTION_COPY[t.kind].note}</span>
                </span>
              </label>
            );
          })}
          {freeQuestions.map((q, i) => (
            <div key={i} className="flex items-center gap-2 lg:col-span-2">
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
        </fieldset>
      </Section>

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-6 lg:rounded-2xl lg:border lg:border-line lg:bg-card lg:p-5">
      <Section title="締め切り" plain>
        <div role="radiogroup" aria-label="締め切り" className="flex flex-wrap gap-1.5">
          {[...DEADLINES.map((d) => ({ id: d.id, label: d.label })), { id: "date", label: "日付を選ぶ" }].map((d) => (
            <button
              key={d.id}
              type="button"
              role="radio"
              aria-checked={deadline === d.id}
              onClick={() => setDeadline(d.id)}
              className={`flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-bold ${deadline === d.id ? "border-coral bg-coral-tint" : "border-line bg-card"}`}
            >
              {d.id === "date" && <CalendarIcon />}
              {d.label}
            </button>
          ))}
        </div>
        {deadline === "date" && (
          <input type="date" value={deadlineDate} min={today ?? undefined} onChange={(e) => setDeadlineDate(e.target.value)} aria-label="締め切りの日付" className={inputClass} />
        )}
        <p className="text-xs leading-relaxed text-muted">
          {closesAt ? `${formatDay(closesAt)} 23:59 まで。` : deadline === "none" ? "締め切りなし。" : ""}
          過ぎると答えられなくなり、一覧からも外れます。あとから変えられます。
        </p>
      </Section>

      <Section title="公開範囲" plain>
        <div role="radiogroup" aria-label="公開範囲" className="flex flex-col gap-2">
          <ScopeOption checked={isPublic} onSelect={() => setIsPublic(true)} title="公開する（だれでも答えられる）">
            「意見募集中」の一覧に並び、だれでも答えられます。ほかの意見に答えるほど、前に出やすくなります。
          </ScopeOption>
          <ScopeOption checked={!isPublic} onSelect={() => setIsPublic(false)} title="リンクを知っている人だけ">
            一覧には並びません。送った相手だけが答えられます。
          </ScopeOption>
        </div>
        <p className="text-xs text-muted">あとから変えられます。届いた意見は、どちらでも募集した人だけが読めます。</p>
      </Section>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-4">
      <div className="lg:flex-1">
      <Field
        label="表示する名前"
        required
        note={
          profileName && makerName.trim() === profileName
            ? "プロフィールの名前が入っています。変えたいときは、自分のリンクの画面のプロフィールから"
            : "「〇〇さんが意見を募集しています」と出ます。ニックネームで大丈夫です"
        }
        noteBelow
      >
        <input value={makerName} onChange={(e) => setMakerName(e.target.value)} maxLength={20} placeholder="例：きのと" aria-label="表示する名前" className={inputClass} />
      </Field>
      </div>

      <div className="flex flex-col gap-1.5 lg:mt-6 lg:w-64">
        {error && <p role="alert" className="text-sm font-bold text-coral">{error}</p>}
        <button type="button" onClick={submit} disabled={!canSubmit} className="min-h-12 rounded-full bg-coral px-6 font-bold text-night disabled:opacity-40">
          {busy ? "保存しています…" : editing ? "変更を保存する" : "募集を始める"}
        </button>
        <p className="text-center text-xs text-muted lg:hidden">質問は {questionCount} 個。答える人は30秒ほどで答えられます。</p>
      </div>
      </div>
    </div>
    <Preview {...preview} />
    </div>
  );
}

/** パソコンの幅だけ：入力しながら、答える人にどう見えるかを右に出す */
function Preview({
  kind,
  title,
  images,
  tagline,
  makerName,
  closesAt,
  kinds,
  freeQuestions,
}: {
  kind: LinkKind;
  title: string;
  images: string[];
  tagline: string;
  makerName: string;
  closesAt: Date | null;
  kinds: QuestionKind[];
  freeQuestions: string[];
}) {
  const labels = [
    ...TEMPLATE_KINDS.filter((t) => kinds.includes(t.kind)).map((t) => QUESTION_COPY[t.kind].label),
    ...freeQuestions.map((q) => q.trim()).filter(Boolean),
  ];
  return (
    <aside aria-label="答える人からの見え方" className="sticky top-6 hidden flex-col gap-2.5 lg:flex">
      <span className="text-[13px] font-bold text-muted">答える人には、こう見えます</span>
      <div className="flex flex-col items-start gap-2.5 rounded-2xl border border-line bg-card p-[18px] shadow-[0_12px_32px_rgba(28,24,56,0.08)]">
        <span className="text-[11px] text-muted">
          {makerName.trim() || "あなた"}さんが意見を募集しています{closesAt ? ` · ${formatDay(closesAt).replace(/（.）/, "")}まで` : ""}
        </span>
        <KindLabel link={{ kind }} />
        <b className={`font-round text-[19px] leading-snug ${title.trim() ? "" : "text-muted"}`}>{title.trim() || "タイトル"}</b>
        {images[0] && (
          // eslint-disable-next-line @next/next/no-img-element -- 端末の中の画像（data URL）なので、Next.js の画像変換は使えない
          <img src={images[0]} alt="" className="max-h-48 w-full rounded-xl border border-line object-contain" />
        )}
        {tagline.trim() && <p className="line-clamp-4 whitespace-pre-wrap text-[13px] leading-relaxed">{tagline.trim()}</p>}
        {labels.slice(0, 2).map((l) => (
          <div key={l} className="flex w-full flex-col gap-1.5">
            <b className="text-[13px]">{l}</b>
            <div className="h-12 rounded-xl border border-line" />
          </div>
        ))}
        {labels.length > 2 && <span className="text-xs text-muted">…ほか {labels.length - 2} 問</span>}
      </div>
      <span className="text-center text-xs text-muted">質問は {labels.length} 個。答える人は30秒ほどで答えられます。</span>
    </aside>
  );
}

const inputClass = "min-h-11 w-full rounded-xl border border-line bg-card px-3 text-base outline-none focus:border-coral";

/** 入力のまとまり。パソコンの幅ではカードにする（plain は、外側がすでにカードのとき） */
function Section({ title, plain = false, children }: { title: string; plain?: boolean; children: React.ReactNode }) {
  return (
    <section className={`flex flex-col gap-2.5 ${plain ? "" : "lg:gap-3.5 lg:rounded-2xl lg:border lg:border-line lg:bg-card lg:p-5"}`}>
      <h2 className="font-round text-base font-bold lg:text-lg">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, note, required, noteBelow, children }: { label: string; note?: string; required?: boolean; noteBelow?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-bold">
        {label}
        {required && <span className="ml-1 text-xs text-coral">必須</span>}
        {note && !noteBelow && <span className="ml-1 text-xs font-normal text-muted">{note}</span>}
      </span>
      {children}
      {note && noteBelow && <span className="text-xs text-muted">{note}</span>}
    </div>
  );
}

function ScopeOption({ checked, onSelect, title, children }: { checked: boolean; onSelect: () => void; title: string; children: React.ReactNode }) {
  return (
    <label className={`flex min-h-11 cursor-pointer items-start gap-2.5 rounded-xl p-2.5 ${checked ? "border-2 border-leaf-dark bg-leaf-tint" : "border border-line bg-card"}`}>
      <input type="radio" name="scope" checked={checked} onChange={onSelect} className="mt-1 h-4 w-4 accent-[var(--leaf-dark)]" />
      <span className="flex flex-col">
        <span className="text-sm font-bold">{title}</span>
        <span className="text-xs leading-relaxed text-muted">{children}</span>
      </span>
    </label>
  );
}
