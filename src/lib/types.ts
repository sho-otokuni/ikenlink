/** 聞きたいことの型。募集する人は、この中から選んで並べる */
export type QuestionKind =
  /** パッと見て、どう思った？（自由に） */
  | "impression"
  /** いいと思うところは？ */
  | "good"
  /** 気になるところ・分かりにくいところは？ */
  | "confused"
  /** あったら使いたい・ほしい？（ほしい／たぶん／いらないかな） */
  | "would_use"
  /** いくらなら払う？ */
  | "price"
  /** 募集する人が自由に書いた質問 */
  | "free"
  /** 前の版の「5秒テスト」。いまは作れない。前に作られたリンクでは、ふつうの質問として出す */
  | "first_look";

export type Question = {
  id: string;
  kind: QuestionKind;
  /** free のときの質問文（ほかの型は決まった文を使う） */
  text?: string;
};

/** 見てほしいものの種類 */
export type LinkKind = "app" | "idea" | "design" | "text" | "other";

/** 意見リンク1本（見てほしいもの1つと、聞きたいこと） */
export type FeedbackLink = {
  id: string;
  kind: LinkKind;
  /** タイトル（例：週末だけの古本カフェ、どう思う？） */
  title: string;
  /** 説明（どんなものか、何に迷っているか。なくてもよい） */
  tagline: string | null;
  /** URL（5つまで。なくてもよい） */
  urls: string[];
  /** 画像（4枚まで。なくてもよい） */
  images: string[];
  questions: Question[];
  /** 募集した人の表示名 */
  makerName: string;
  /** 締め切り（なければ null） */
  closesAt: string | null;
};

/** 答え1件。question.id → 答え */
export type Answers = Record<string, string>;
