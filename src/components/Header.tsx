import Link from "next/link";

import { AccountMenu } from "@/components/AccountMenu";
import { LogoMark } from "@/components/Logo";

const NAV = [
  { href: "/list", label: "みんなの募集" },
  { href: "/me", label: "自分の募集" },
] as const;

/** 画面の中身の幅。スマホでは画面いっぱい、パソコンでは画面の幅を広く使い、1600px までにそろえる（左右の余白は各画面で lg:px-8 xl:px-12） */
export const PAGE_WIDTH = "mx-auto w-full max-w-2xl lg:max-w-[1600px]";

/**
 * 上の帯。左上のロゴを押すとホームへ。
 * current は今いる画面（下線を引く）。answerer は答える人の画面で、「自分の募集」・募集ボタン・アカウントの入口を出さない。
 * パソコンの幅では、どの画面からでも募集を始められるよう、右に「意見を募集する」を出す。
 * 右端はアカウントの入口（ログインしていなければ「ログイン」、していればアイコンとメニュー）
 */
export function Header({ current, answerer = false }: { current?: "/list" | "/me"; answerer?: boolean }) {
  return (
    <div className="lg:border-b lg:border-line">
      <header className={`${PAGE_WIDTH} flex items-center justify-between pl-3 pr-2 pt-1 lg:h-16 lg:px-8 lg:pt-0 xl:px-12`}>
        <Link href="/" aria-label="意見リンク（ホームへ）" className="flex min-h-11 items-center gap-1.5 pr-1 lg:gap-2">
          <LogoMark />
          {/* スマホの幅では、メニューが折り返さないよう、ロゴのマークだけにする */}
          <span className="hidden whitespace-nowrap font-round text-base font-bold sm:inline lg:text-[19px]">意見リンク</span>
        </Link>
        <nav className="flex items-center lg:gap-1">
          {NAV.filter((n) => !answerer || n.href === "/list").map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={current === n.href ? "page" : undefined}
              className={`relative flex min-h-11 items-center whitespace-nowrap rounded-lg px-2.5 text-[13px] font-bold hover:bg-line lg:px-3.5 lg:text-sm ${
                // 今いる画面は、文字の下にまっすぐなコーラルの線を引く（角の丸みに沿わせない）
                current === n.href ? "text-ink after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:bg-coral lg:after:inset-x-3.5" : "text-muted hover:text-ink"
              }`}
            >
              {n.label}
            </Link>
          ))}
          {!answerer && (
            <Link href="/new" className="ml-2 hidden min-h-11 items-center rounded-lg bg-coral px-5 text-sm font-bold text-night lg:flex">
              ＋ 意見を募集する
            </Link>
          )}
          {!answerer && <AccountMenu />}
        </nav>
      </header>
    </div>
  );
}
