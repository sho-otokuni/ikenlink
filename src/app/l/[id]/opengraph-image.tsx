import { getLink } from "@/lib/links";
import { linkCard, OG_SIZE, siteCard } from "@/lib/og";

export const alt = "意見を募集しています｜意見リンク";
export const size = OG_SIZE;
export const contentType = "image/png";

/** 答える画面の画像カード（作った人がリンクを X に貼ったとき） */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const link = await getLink(id);
  return link ? linkCard(link.title, link.makerName) : siteCard();
}
