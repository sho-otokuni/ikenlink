import type { LinkKind, Question, QuestionKind } from "@/lib/types";

/**
 * 型ごとの、答える人に見せる文と選択肢。
 * 画面の文字は、あとで翻訳できるようここにまとめる。
 */
export const QUESTION_COPY: Record<
  QuestionKind,
  {
    label: string;
    /** 作る画面で、質問の下に出す説明 */
    note: string;
    hint?: string;
    choices?: string[];
    /** 前の版の選択肢 → いまの選択肢（届いた意見を数えるときに合わせる） */
    aliases?: Record<string, string>;
    placeholder?: string;
  }
> = {
  impression: {
    label: "パッと見て、どう思いましたか？",
    note: "第一印象を自由に",
    placeholder: "思ったままで大丈夫です",
  },
  good: {
    label: "いいと思うところは？",
    note: "自由に",
  },
  confused: {
    label: "気になるところ・分かりにくいところは？",
    note: "自由に",
    placeholder: "なければ空欄で大丈夫です",
  },
  would_use: {
    label: "あったら使いたい・ほしいと思いますか？",
    note: "ほしい／たぶん／いらないかな",
    choices: ["ほしい", "たぶん", "いらないかな"],
    aliases: { 使いたい: "ほしい" },
  },
  price: {
    label: "お金を払うなら、いくらまで？",
    note: "無料なら／〜500円／〜1,000円／それ以上",
    choices: ["無料なら", "〜500円", "〜1,000円", "それ以上"],
    aliases: { "100円まで": "〜500円", "500円まで": "〜500円", "1,000円以上でも": "それ以上" },
  },
  free: {
    label: "",
    note: "",
    placeholder: "思ったことを自由にどうぞ",
  },
  single: {
    label: "",
    note: "",
  },
  multi: {
    label: "",
    note: "",
  },
  first_look: {
    label: "パッと見て、何に見えましたか？",
    note: "",
    placeholder: "思ったままで大丈夫です",
  },
};

/** 質問は全部でいくつまで・選択肢はいくつまで・文字数 */
export const MAX_QUESTIONS = 5;
export const MIN_CHOICES = 2;
export const MAX_CHOICES = 6;
export const MAX_QUESTION_TEXT = 60;
export const MAX_CHOICE_TEXT = 20;

/** 複数選べる質問の答えは、選んだものをこの文字（改行）でつないで1つにする */
export const ANSWER_SEPARATOR = String.fromCharCode(10);

/** 新しく募集するときに、最初から入っている質問 */
export const DEFAULT_QUESTION_TEXT = "あなたの意見をお聞かせください";

/** 作る画面で選べる質問の形式 */
export const QUESTION_TYPES: { kind: "free" | "single" | "multi"; label: string }[] = [
  { kind: "free", label: "自由入力" },
  { kind: "single", label: "選択式（1つ選択）" },
  { kind: "multi", label: "選択式（複数選択）" },
];

/** よく使われる質問。押すと、この中身が入った状態で質問が足される（足したあとで直せる） */
export const QUESTION_PRESETS: { text: string; kind: "free" | "single" | "multi"; choices?: string[] }[] = [
  { text: "いいと思うところは？", kind: "free" },
  { text: "気になるところ・分かりにくいところは？", kind: "free" },
  { text: "あったら使いたい・ほしいと思いますか？", kind: "single", choices: ["ほしい", "たぶん", "いらないかな"] },
  { text: "お金を払うなら、いくらまで？", kind: "single", choices: ["無料なら", "〜500円", "〜1,000円", "それ以上"] },
];

/** 質問の文。自分で書いた質問はその文、前の版の決まった質問は決まった文 */
export function questionLabel(q: Question): string {
  return q.kind === "free" || q.kind === "single" || q.kind === "multi" ? (q.text ?? "") : QUESTION_COPY[q.kind].label;
}

/** 選択式なら選択肢（前の版の決まった質問は、決まった選択肢）。自由入力なら undefined */
export function questionChoices(q: Question): string[] | undefined {
  if (q.kind === "single" || q.kind === "multi") return q.choices ?? [];
  return QUESTION_COPY[q.kind].choices;
}

/** 入力欄の例の文 */
export function questionPlaceholder(q: Question): string | undefined {
  return QUESTION_COPY[q.kind].placeholder;
}

/**
 * 答え（1つの文字）を、選んだもの・書いたものの並びにする。
 * 複数選べる質問は改行でつないであるので分け、前の版の選択肢は、いまの選択肢に合わせる
 */
export function answerValues(q: Question, raw: string | undefined): string[] {
  const v = (raw ?? "").trim();
  if (!v) return [];
  if (q.kind === "multi") return v.split(ANSWER_SEPARATOR).filter(Boolean);
  return [QUESTION_COPY[q.kind].aliases?.[v] ?? v];
}

/** 見てほしいものの種類の呼び方（並びは作る画面・一覧の順） */
export const LINK_KINDS: { kind: LinkKind; label: string }[] = [
  { kind: "app", label: "アプリ・サービス" },
  { kind: "idea", label: "アイデア" },
  { kind: "design", label: "デザイン" },
  { kind: "text", label: "文章" },
  { kind: "other", label: "そのほか" },
];

export const LINK_KIND_LABEL = Object.fromEntries(LINK_KINDS.map((k) => [k.kind, k.label])) as Record<LinkKind, string>;

/** 種類ごとのラベルの色（globals.css の名前） */
export const LINK_KIND_TINT: Record<LinkKind, string> = {
  app: "bg-leaf-tint",
  idea: "bg-coral-tint",
  design: "bg-grape-tint",
  text: "bg-peach-tint",
  other: "bg-line",
};

/** 締め切りの選び方 */
export const DEADLINES: { id: string; label: string; days: number | null }[] = [
  { id: "none", label: "なし", days: null },
  { id: "3d", label: "3日", days: 3 },
  { id: "1w", label: "1週間", days: 7 },
  { id: "1m", label: "1か月", days: 30 },
];

/** 今日から days 日後の 23:59 */
export function deadlineAfter(days: number, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 0, 0);
  return d;
}

/** 選んだ日（yyyy-mm-dd）の 23:59 */
export function deadlineOn(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 0, 0);
}

/** 「11月11日（水）」 */
export function formatDay(iso: string | Date) {
  return new Date(iso).toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" }).replace(/\((.)\)/, "（$1）");
}

/** 締め切りまでの残り：「今日まで」「あと3日」。過ぎていれば null */
export function remaining(closesAt: string | null, now = new Date()) {
  if (!closesAt) return null;
  const end = new Date(closesAt);
  if (end <= now) return null;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const days = Math.round((startOfEnd.getTime() - startOfToday.getTime()) / 86_400_000);
  return days <= 0 ? "今日まで" : `あと${days}日`;
}

export function isClosed(closesAt: string | null, now = new Date()) {
  return closesAt !== null && new Date(closesAt) <= now;
}
