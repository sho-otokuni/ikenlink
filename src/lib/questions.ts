import type { LinkKind, QuestionKind } from "@/lib/types";

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
  first_look: {
    label: "パッと見て、何に見えましたか？",
    note: "",
    placeholder: "思ったままで大丈夫です",
  },
};

/** 作る画面で選べる型の並び（自由な質問は別に足す）と、最初から印を付けておくもの */
export const TEMPLATE_KINDS: { kind: Exclude<QuestionKind, "free" | "first_look">; on: boolean }[] = [
  { kind: "impression", on: true },
  { kind: "good", on: true },
  { kind: "confused", on: true },
  { kind: "would_use", on: true },
  { kind: "price", on: false },
];

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
