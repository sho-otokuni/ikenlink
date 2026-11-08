"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { CharCount } from "@/components/CharCount";
import { CalendarIcon } from "@/components/icons";
import { LinkPreview } from "@/components/LinkPreview";
import { checkDrafts, defaultDrafts, draftsFrom, QuestionBuilder, toQuestions, type QuestionDraft } from "@/components/QuestionBuilder";
import { getAccount, setDisplayName } from "@/lib/auth";
import { shrinkImage } from "@/lib/image";
import { createLink, newLinkId, updateLink, uploadImage } from "@/lib/links";
import { DEADLINES, deadlineAfter, deadlineOn, formatDay, LINK_KINDS } from "@/lib/questions";
import type { FeedbackLink, LinkKind, Question } from "@/lib/types";

const MAX_IMAGES = 4;
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
  const [kind, setKind] = useState<LinkKind>(start?.kind ?? "app");
  const [title, setTitle] = useState(start?.title ?? "");
  const [images, setImages] = useState<string[]>(start?.images ?? []);
  // 画像それぞれのタイトル（images と同じ並び。なくてもよい）
  const [captions, setCaptions] = useState<string[]>(start?.imageCaptions ?? []);
  const [tagline, setTagline] = useState(start?.tagline ?? "");
  const [urls, setUrls] = useState<string[]>(start?.urls.length ? start.urls : [""]);
  // 聞きたいこと。新しく募集するときは「あなたの意見を聞かせてください」だけ。直すときは、いまの質問から始める
  const [drafts, setDrafts] = useState<QuestionDraft[]>(() => (start ? draftsFrom(start.questions) : defaultDrafts()));
  // 意見が届いたあとは、答えと質問がずれないよう、質問は変えられない
  const questionsLocked = (editing?.responseCount ?? 0) > 0;
  // 締め切り：DEADLINES の id か、"date"（日付を選ぶ）。直すときは、いまの締め切りの日付から始める
  const [deadline, setDeadline] = useState(start ? (start.closesAt ? "date" : "none") : "1w");
  const [deadlineDate, setDeadlineDate] = useState(start?.closesAt ? dayString(start.closesAt) : "");
  // 公開すると、みんなの募集の一覧に並び、誰でも答えられる
  const [isPublic, setIsPublic] = useState(editing?.isPublic ?? true);
  const [makerName, setMakerName] = useState(start?.makerName ?? "");
  // プロフィールに保存してある「表示名」（なければ空。初めて募集したときに保存する）
  const [profileName, setProfileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const today = useToday();
  // 画像は選んだらすぐ保存場所に置き始める（保存を押したときに待たないように）。
  // そのため、募集の id は最初の画像を選んだときに決めておく（直すときは、その募集の id）
  const linkId = useRef<string | null>(editing?.link.id ?? null);
  const uploads = useRef(new Map<string, Promise<string | null>>());

  // プロフィールの名前を、表示名の欄に入れておく（もう何か書いてあれば上書きしない）
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

  const questionCount = questionsLocked && editing ? editing.link.questions.length : drafts.length;
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
    linkId.current ??= newLinkId();
    for (const src of shrunk) uploads.current.set(src, uploadImage(linkId.current, src));
    setImages((list) => [...list, ...shrunk].slice(0, MAX_IMAGES));
    setCaptions((list) => [...list, ...shrunk.map(() => "")].slice(0, MAX_IMAGES));
  }

  /**
   * 保存を押したとき。思わぬ失敗（通信が切れたなど）でも「保存しています…」のまま止まらないよう、
   * 必ずボタンを戻して、知らせを出す
   */
  async function submit() {
    if (!canSubmit) return;
    try {
      await save();
    } catch {
      setBusy(false);
      setError("保存できませんでした。通信環境を確かめて、もう一度お試しください");
    }
  }

  async function save() {
    setError(null);
    // 同じ URL を2回入れても、1つにまとめて保存する
    const cleanUrls = [...new Set(urls.map((u) => u.trim()).filter(Boolean))];
    if (cleanUrls.some((u) => !/^https?:\/\/\S+$/.test(u))) return setError("URL は https:// から始まる形で入れてください");
    if (deadline === "date" && !deadlineDate) return setError("締め切りの日付を選んでください");
    if (!questionsLocked) {
      const problem = checkDrafts(drafts);
      if (problem) return setError(problem);
    }
    setBusy(true);
    // 直すときに質問を変えられないなら、そのまま
    const questions: Question[] | null = questionsLocked ? null : toQuestions(drafts);
    // 置き始めておいた画像を待つ（まだ置いていないものは、ここで置く）
    const id = (linkId.current ??= newLinkId());
    const placed = await Promise.all(images.map((src) => (src.startsWith("data:") ? (uploads.current.get(src) ?? uploadImage(id, src)) : Promise.resolve(src))));
    if (placed.some((u) => u === null)) {
      // うまく置けなかった画像は、次に保存を押したときに置き直す
      images.forEach((src) => uploads.current.delete(src));
      setBusy(false);
      return setError("画像を保存できませんでした。通信環境を確かめて、もう一度お試しください");
    }
    const draft = {
      kind,
      title: title.trim(),
      tagline: tagline.trim() || null,
      urls: cleanUrls,
      images: placed as string[],
      imageCaptions: captions,
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
      // saved に毎回ちがう値を付けて、届いた意見の画面を作り直す（前に開いたときの古い中身が一瞬出ないように）
      router.push(`/me/${editing.link.id}?saved=${new Date().getTime().toString(36)}`);
      return;
    }
    const r = await createLink({ ...draft, questions: questions ?? [] }, id);
    if (!r.ok) {
      setBusy(false);
      return setError(r.message);
    }
    // プロフィールに名前がまだなければ、いま使った名前を保存しておく（次からは自動で入る）。失敗しても募集はできている
    if (!profileName) void setDisplayName(makerName);
    router.push(`/me/${r.data}?created=1`);
  }

  const preview = { kind, title, images, captions, tagline, urls, makerName, closesAt, drafts };

  return (
    <div className="mt-3 lg:mt-4 lg:grid lg:grid-cols-[1fr_400px] lg:items-start lg:gap-8 xl:grid-cols-[1fr_460px]">
    <div className="flex flex-col gap-4 lg:gap-3">
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
        <Field label="タイトル" required count={{ value: title, max: 40 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} placeholder="例：作っている家計簿アプリ、使ってみたい？" aria-label="タイトル" className={inputClass} />
        </Field>
        <Field label={`画像（${images.length}/${MAX_IMAGES}）`} note="スクショ、手書きのメモ、ラフでも OK">
          <div className="flex flex-wrap items-start gap-2">
            {images.map((src, i) => (
              // 画像の下に、タイトル（任意）を書ける。「これはこの画面です」と説明するため
              <div key={src.slice(-40) + i} className="flex w-36 flex-col gap-1 lg:w-44">
                <div className="relative h-24 w-full overflow-hidden rounded-lg border border-line bg-card lg:h-28">
                  {/* eslint-disable-next-line @next/next/no-img-element -- 端末の中の画像（data URL）なので、Next.js の画像変換は使えない */}
                  <img src={src} alt={captions[i] || `画像 ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImages((list) => list.filter((_, k) => k !== i));
                      setCaptions((list) => list.filter((_, k) => k !== i));
                    }}
                    aria-label={`画像 ${i + 1} を外す`}
                    className="absolute right-0 top-0 flex h-11 w-11 items-start justify-end p-1"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-night/70 text-sm text-white">×</span>
                  </button>
                </div>
                <input
                  value={captions[i] ?? ""}
                  onChange={(e) => setCaptions((list) => images.map((_, k) => (k === i ? e.target.value : (list[k] ?? ""))))}
                  maxLength={40}
                  placeholder="タイトル（任意）"
                  aria-label={`画像 ${i + 1} のタイトル`}
                  className="min-h-11 w-full rounded-lg border border-line bg-card px-2 text-sm outline-none focus:border-coral"
                />
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
                className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line text-xs text-muted hover:border-coral lg:min-w-48 lg:flex-1"
              >
                <span className="text-xl leading-none">＋</span>
                <span className="lg:hidden">画像</span>
                <span className="hidden lg:inline">ここに画像をドラッグ、または選ぶ</span>
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addImages(e.target.files)} />
              </label>
            )}
          </div>
        </Field>
        <div className="flex flex-col gap-2.5">
        <Field label="説明" note="（どんなものか、何に迷っているか）" count={{ value: tagline, max: 400 }}>
          <textarea
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            maxLength={400}
            rows={3}
            placeholder="例：個人で家計簿アプリを作っています。初めて開いたときに使い方が分かるかどうか、率直な感想を聞かせてください。"
            aria-label="説明"
            className="rounded-lg border border-line bg-card px-3 py-2.5 text-base leading-relaxed outline-none focus:border-coral"
          />
        </Field>
        <Field label="URL" note="（任意：最大5個まで）">
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
                className="min-h-11 self-start rounded-lg border border-dashed border-line px-4 text-sm font-bold text-muted hover:border-coral"
              >
                ＋ URL を追加
              </button>
            )}
          </div>
        </Field>
        </div>
      </Section>

      <Section title="聞きたいこと">
        {questionsLocked && (
          <p className="rounded-lg bg-peach-tint px-3 py-2 text-xs leading-relaxed">
            もう意見が {editing?.responseCount} 件届いているので、質問は変えられません（届いた答えと質問がずれないように）。
          </p>
        )}
        <fieldset disabled={questionsLocked} className={`m-0 border-0 p-0 ${questionsLocked ? "opacity-50" : ""}`}>
        <QuestionBuilder drafts={drafts} onChange={setDrafts} />
        </fieldset>
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
        <div role="radiogroup" aria-label="公開範囲" className="flex flex-col gap-2 lg:grid lg:grid-cols-2">
          <ScopeOption checked={isPublic} onSelect={() => setIsPublic(true)} title="公開（誰でも回答可）">
            「みんなの募集」の一覧に並び、誰でも回答できます。
          </ScopeOption>
          <ScopeOption checked={!isPublic} onSelect={() => setIsPublic(false)} title="非公開（リンクを知っている人だけ）">
            一覧には並びません。リンクを送った相手だけが回答できます。
          </ScopeOption>
        </div>
      </Section>

      <div className="flex flex-col lg:rounded-lg lg:border lg:border-line lg:bg-card lg:px-4 lg:py-3.5">
      <Field
        label="表示名"
        required
        count={{ value: makerName, max: 20 }}
        note={
          profileName && makerName.trim() === profileName
            ? "プロフィールで設定した名前が自動で入ります。※入力欄から変更可"
            : "「〇〇さんが意見を募集しています」と出ます。"
        }
        noteBelow
      >
        <input value={makerName} onChange={(e) => setMakerName(e.target.value)} maxLength={20} placeholder="例：はなこ" aria-label="表示名" className={inputClass} />
      </Field>
      </div>

      <div className="flex flex-col gap-1.5">
        {error && <p role="alert" className="text-sm font-bold text-coral lg:text-right">{error}</p>}
        <div className="flex flex-col gap-1.5 lg:flex-row-reverse lg:items-center lg:justify-between lg:gap-4">
          <button type="button" onClick={submit} disabled={!canSubmit} className="min-h-12 rounded-lg bg-coral px-6 font-bold text-night disabled:opacity-40 lg:w-64">
            {busy ? "保存しています…" : editing ? "変更を保存する" : "募集を始める"}
          </button>
        </div>
      </div>
    </div>
    <Preview {...preview} />
    </div>
  );
}

/** パソコンの幅だけ：入力しながら、答える人にどう見えるかを右に出す */
function Preview({ drafts, ...rest }: Omit<React.ComponentProps<typeof LinkPreview>, "questions" | "className" | "sticky"> & { drafts: QuestionDraft[] }) {
  const questions = drafts
    .filter((d) => d.text.trim())
    .map((d) => ({
      label: d.text.trim(),
      choices: d.kind === "free" ? undefined : d.choices.map((c) => c.trim()).filter(Boolean),
      multiple: d.kind === "multi",
    }));
  return <LinkPreview {...rest} questions={questions} sticky className="hidden lg:flex" />;
}

const inputClass = "min-h-11 w-full rounded-lg border border-line bg-card px-3 text-base outline-none focus:border-coral";

/** 入力のまとまり。パソコンの幅ではカードにする */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5 lg:rounded-lg lg:border lg:border-line lg:bg-card lg:px-4 lg:py-3.5">
      <h2 className="font-round text-base font-bold lg:text-lg">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  note,
  required,
  noteBelow,
  count,
  children,
}: {
  label: string;
  note?: string;
  required?: boolean;
  noteBelow?: boolean;
  /** 入力した文字数と上限（右上に「12/40」と出す） */
  count?: { value: string; max: number };
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-baseline text-sm font-bold">
        <span>
          {label}
          {required && <span className="ml-1 text-xs text-coral">必須</span>}
          {note && !noteBelow && <span className="ml-1 text-xs font-normal text-muted">{note}</span>}
        </span>
        {count && <CharCount value={count.value} max={count.max} />}
      </span>
      {children}
      {note && noteBelow && <span className="text-xs text-muted">{note}</span>}
    </div>
  );
}

function ScopeOption({ checked, onSelect, title, children }: { checked: boolean; onSelect: () => void; title: string; children: React.ReactNode }) {
  return (
    <label className={`flex min-h-11 cursor-pointer items-start gap-2.5 rounded-lg p-2.5 ${checked ? "border-2 border-leaf-dark bg-leaf-tint" : "border border-line bg-card"}`}>
      <input type="radio" name="scope" checked={checked} onChange={onSelect} className="mt-1 h-4 w-4 accent-[var(--leaf-dark)]" />
      <span className="flex flex-col">
        <span className="text-sm font-bold">{title}</span>
        <span className="text-xs leading-relaxed text-muted">{children}</span>
      </span>
    </label>
  );
}
