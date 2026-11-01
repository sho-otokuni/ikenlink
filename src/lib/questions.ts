import type { QuestionKind } from "@/lib/types";

/**
 * 型ごとの、答える人に見せる文と選択肢。
 * 画面の文字は、あとで翻訳できるようここにまとめる。
 */
export const QUESTION_COPY: Record<
  QuestionKind,
  { label: string; hint?: string; choices?: string[]; placeholder?: string }
> = {
  first_look: {
    label: "これ、何のサービスに見えましたか？",
    hint: "パッと見の印象で大丈夫です",
    placeholder: "例：家計簿のアプリ？",
  },
  would_use: {
    label: "使ってみたいと思いますか？",
    choices: ["使いたい", "たぶん", "いらないかな"],
  },
  confused: {
    label: "分かりにくかったところはありますか？",
    hint: "なければ空欄で大丈夫です",
    placeholder: "例：最初のボタンが何をするのか分からなかった",
  },
  price: {
    label: "お金を払うなら、月いくらまでなら？",
    choices: ["無料なら", "100円まで", "500円まで", "1,000円以上でも"],
  },
  free: {
    label: "",
    placeholder: "思ったことを自由にどうぞ",
  },
};

/** 5秒テストで画面を見せる長さ（ミリ秒） */
export const FIRST_LOOK_MS = 5000;
