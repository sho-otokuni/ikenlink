import Link from "next/link";

import { LogoMark } from "@/components/Logo";

const NAV = [
  { href: "/list", label: "意見募集中" },
  { href: "/me", label: "自分のリンク" },
] as const;

/** 画面の中身の幅。スマホでは画面いっぱい、パソコンでは 1120px までにそろえる */
export const PAGE_WIDTH = "mx-auto w-full max-w-2xl lg:max-w-[1120px]";

/**
 * 上の帯。左上のロゴを押すとホームへ。
 * current は今いる画面（下線を引く）。answerer は答える人の画面で、「自分のリンク」と募集ボタンを出さない。
 * パソコンの幅では、どの画面からでも募集を始められるよう、右に「意見を募集する」を出す
 */
export function Header({ current, answerer = false }: { current?: "/list" | "/me"; answerer?: boolean }) {
  return (
    <div className="lg:border-b lg:border-line">
      <header className={`${PAGE_WIDTH} flex items-center justify-between pl-3 pr-2 pt-1 lg:h-16 lg:px-0 lg:pt-0`}>
        <Link href="/" aria-label="意見リンク（ホームへ）" className="flex min-h-11 items-center gap-1.5 pr-1 lg:gap-2">
          <LogoMark />
          <span className="font-round text-base font-bold lg:text-[19px]">意見リンク</span>
        </Link>
        <nav className="flex items-center lg:gap-1">
          {NAV.filter((n) => !answerer || n.href === "/list").map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={current === n.href ? "page" : undefined}
              className={`flex min-h-11 items-center px-2.5 text-[13px] font-bold lg:px-3.5 lg:text-sm ${
                current === n.href ? "text-ink shadow-[inset_0_-2px_0_var(--coral)]" : "text-muted hover:text-ink"
              }`}
            >
              {n.label}
            </Link>
          ))}
          {!answerer && (
            <Link href="/new" className="ml-2 hidden min-h-11 items-center rounded-full bg-coral px-5 text-sm font-bold text-night lg:flex">
              ＋ 意見を募集する
            </Link>
          )}
        </nav>
      </header>
    </div>
  );
}
