/** 聞きたいことの型。作る人は、この中から選んで並べる */
export type QuestionKind =
  /** 5秒だけ画面を見せてから「何に見えた？」を聞く */
  | "first_look"
  /** 使ってみたい？（使いたい／たぶん／いらない） */
  | "would_use"
  /** どこで迷った？ */
  | "confused"
  /** いくらなら払う？ */
  | "price"
  /** 作る人が自由に書いた質問 */
  | "free";

export type Question = {
  id: string;
  kind: QuestionKind;
  /** free のときの質問文（ほかの型は決まった文を使う） */
  text?: string;
};

/** 意見リンク1本（作ったもの1つと、聞きたいこと） */
export type FeedbackLink = {
  id: string;
  /** 作ったものの名前 */
  title: string;
  /** ひとことの説明（なくてもよい。5秒テストを公平にするため、答える前は隠す） */
  tagline: string | null;
  /** 作ったものの URL（触ってみる） */
  url: string | null;
  /** 画面の写真（3枚まで） */
  images: string[];
  questions: Question[];
  /** 作った人の表示名 */
  makerName: string;
};

/** 答え1件。question.id → 答え */
export type Answers = Record<string, string>;
