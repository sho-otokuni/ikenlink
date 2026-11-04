import { OG_SIZE, siteCard } from "@/lib/og";

export const alt = "意見リンク：「どう思う？」を、気軽に聞ける。";
export const size = OG_SIZE;
export const contentType = "image/png";

/** サイト全体の画像カード（はじめの画面などを X に貼ったとき） */
export default async function Image() {
  return siteCard();
}
