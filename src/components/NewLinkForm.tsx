"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import { CalendarIcon } from "@/components/icons";
import { shrinkImage } from "@/lib/image";
import { createLink } from "@/lib/links";
import { DEADLINES, deadlineAfter, deadlineOn, formatDay, LINK_KINDS, QUESTION_COPY, TEMPLATE_KINDS } from "@/lib/questions";
import type { LinkKind, Question, QuestionKind } from "@/lib/types";

const MAX_IMAGES = 4;
const MAX_FREE = 2;

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

/** 意見を募集する。画像1枚だけでも、URL だけでも始められる */
export function NewLinkForm() {
  const router = useRouter();
  const [kind, setKind] = useState<LinkKind>("idea");
  const [title, setTitle] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [tagline, setTagline] = useState("");
  const [url, setUrl] = useState("");
  const [kinds, setKinds] = useState<QuestionKind[]>(TEMPLATE_KINDS.filter((t) => t.on).map((t) => t.kind));
  const [freeQuestions, setFreeQuestions] = useState<string[]>([]);
  // 締め切り：DEADLINES の id か、"date"（日付を選ぶ）
  const [deadline, setDeadline] = useState("1w");
  const [deadlineDate, setDeadlineDate] = useState("");
  // 公開すると、意見募集中の一覧に並び、だれでも答えられる
  const [isPublic, setIsPublic] = useState(true);
  const [makerName, setMakerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const today = useToday();

  const questionCount = kinds.length + freeQuestions.filter((q) => q.trim()).length;
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
    const trimmedUrl = url.trim();
    if (trimmedUrl && !/^https?:\/\/\S+$/.test(trimmedUrl)) return setError("URL は https:// から始まる形で入れてください");
    if (deadline === "date" && !deadlineDate) return setError("締め切りの日付を選んでください");
    setBusy(true);
    // 並びは型の順、自由な質問は最後
    const questions: Question[] = [
      ...TEMPLATE_KINDS.filter((t) => kinds.includes(t.kind)).map((t, i) => ({ id: `q${i + 1}`, kind: t.kind })),
      ...freeQuestions
        .map((text) => text.trim())
        .filter(Boolean)
        .map((text, i) => ({ id: `f${i + 1}`, kind: "free" as const, text })),
    ];
    const r = await createLink({
      kind,
      title: title.trim(),
      tagline: tagline.trim() || null,
      url: trimmedUrl || null,
      images,
      questions,
      makerName: makerName.trim(),
      closesAt: closesAt?.toISOString() ?? null,
      isPublic,
    });
    if (!r.ok) {
      setBusy(false);
      return setError(r.message);
    }
    router.push(`/me/${r.data}?created=1`);
  }

  return (
    <div className="mt-4 flex flex-col gap-5">
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
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line text-xs text-muted hover:border-coral">
                <span className="text-xl leading-none">＋</span>
                画像
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addImages(e.target.files)} />
              </label>
            )}
          </div>
        </Field>
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
          <input value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" placeholder="https://" aria-label="URL" className={inputClass} />
        </Field>
      </Section>

      <Section title="聞きたいこと">
        <div className="flex flex-col gap-2">
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

      <Section title="締め切り">
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

      <Section title="公開範囲">
        <div role="radiogroup" aria-label="公開範囲" className="flex flex-col gap-2">
          <ScopeOption checked={isPublic} onSelect={() => setIsPublic(true)} title="公開する（だれでも答えられる）">
            「意見募集中」の一覧に並び、だれでも答えられます。ほかの募集に答えるほど、前に出やすくなります。
          </ScopeOption>
          <ScopeOption checked={!isPublic} onSelect={() => setIsPublic(false)} title="リンクを知っている人だけ">
            一覧には並びません。送った相手だけが答えられます。
          </ScopeOption>
        </div>
        <p className="text-xs text-muted">あとから変えられます。届いた意見は、どちらでも募集した人だけが読めます。</p>
      </Section>

      <Field label="表示する名前" required note="「〇〇さんが意見を募集しています」と出ます。ニックネームで大丈夫です" noteBelow>
        <input value={makerName} onChange={(e) => setMakerName(e.target.value)} maxLength={20} placeholder="例：きのと" aria-label="表示する名前" className={inputClass} />
      </Field>

      <div className="flex flex-col gap-1.5">
        {error && <p role="alert" className="text-sm font-bold text-coral">{error}</p>}
        <button type="button" onClick={submit} disabled={!canSubmit} className="min-h-12 rounded-full bg-coral px-6 font-bold text-night disabled:opacity-40">
          {busy ? "準備しています…" : "募集を始める"}
        </button>
        <p className="text-center text-xs text-muted">質問は {questionCount} 個。答える人は30秒ほどで答えられます。</p>
      </div>
    </div>
  );
}

const inputClass = "min-h-11 w-full rounded-xl border border-line bg-card px-3 text-base outline-none focus:border-coral";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="font-round text-base font-bold">{title}</h2>
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
