import Link from "next/link";

import { PAGE_WIDTH } from "@/components/Header";

const LINKS = [
  { href: "/guide", label: "使い方" },
  { href: "/terms", label: "利用規約" },
  { href: "/privacy", label: "プライバシーポリシー" },
] as const;

/** どのページにも出す、いちばん下の帯（使い方・利用規約・プライバシーポリシー） */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className={`${PAGE_WIDTH} flex flex-col gap-1 px-3 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8 xl:px-12`}>
        <nav aria-label="このサイトについて" className="flex flex-wrap gap-x-1">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="flex min-h-11 items-center px-2 text-xs font-bold text-muted first:pl-0 hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <span className="text-[11px] text-muted">© 2026 意見リンク</span>
      </div>
    </footer>
  );
}
