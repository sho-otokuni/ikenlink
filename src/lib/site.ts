/** サイト全体の名前・説明・住所（検索エンジンや SNS のカードに使う） */

export const SITE_NAME = "意見リンク";

/** 検索結果に出す、サイトの説明（120字前後） */
export const SITE_DESCRIPTION =
  "「これ、どう思う？」を気軽に聞ける意見募集サービス。アイデアや作りかけのアプリ、デザイン、文章に、画像や URL を貼るだけで意見が集まるリンクを作れます。質問は自由入力・選択式から自由に設定でき、回答は登録不要・匿名で30秒。";

/** サイトの住所。独自ドメインにしたら NEXT_PUBLIC_SITE_URL に入れる */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
