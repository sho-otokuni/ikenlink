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
  /** 募集する人が書いた質問（自由入力） */
  | "free"
  /** 募集する人が書いた選択式の質問（1つ選ぶ） */
  | "single"
  /** 募集する人が書いた選択式の質問（複数選べる。答えは選んだものを改行でつなぐ） */
  | "multi"
  /** 前の版の「5秒テスト」。いまは作れない。前に作られたリンクでは、ふつうの質問として出す */
  | "first_look";

export type Question = {
  id: string;
  kind: QuestionKind;
  /** free・single・multi のときの質問文（前の版の決まった型は、決まった文を使う） */
  text?: string;
  /** single・multi のときの選択肢 */
  choices?: string[];
};

/** 見てほしいものの種類 */
export type LinkKind = "app" | "idea" | "design" | "text" | "other";

/** 意見リンク1本（見てほしいもの1つと、聞きたいこと） */
export type FeedbackLink = {
  id: string;
  kind: LinkKind;
  /** タイトル（例：作っている家計簿アプリ、使ってみたい？） */
  title: string;
  /** 説明（どんなものか、何に迷っているか。なくてもよい） */
  tagline: string | null;
  /** URL（5つまで。なくてもよい） */
  urls: string[];
  /** 画像（4枚まで。なくてもよい） */
  images: string[];
  /** 画像それぞれのタイトル（images と同じ並び。なければ空の文字） */
  imageCaptions: string[];
  questions: Question[];
  /** 募集した人の表示名 */
  makerName: string;
  /** 締め切り（なければ null） */
  closesAt: string | null;
};

/** 答え1件。question.id → 答え */
export type Answers = Record<string, string>;
