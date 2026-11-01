import { OG_SIZE, siteCard } from "@/lib/og";

export const alt = "意見リンク：作ったものに、人の意見を。";
export const size = OG_SIZE;
export const contentType = "image/png";

/** サイト全体の画像カード（はじめの画面などを X に貼ったとき） */
export default async function Image() {
  return siteCard();
}
