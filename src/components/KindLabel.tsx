import { LINK_KIND_LABEL, LINK_KIND_TINT } from "@/lib/questions";
import type { FeedbackLink } from "@/lib/types";

/** 見てほしいものの種類のラベル */
export function KindLabel({ link, small = false }: { link: Pick<FeedbackLink, "kind">; small?: boolean }) {
  return (
    <span className={`rounded-full px-2 py-px font-bold ${small ? "text-[10px]" : "text-[11px]"} ${LINK_KIND_TINT[link.kind]}`}>{LINK_KIND_LABEL[link.kind]}</span>
  );
}
