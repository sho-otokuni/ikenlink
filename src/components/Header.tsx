import Link from "next/link";

/** 作る人の画面の上の帯。ロゴと「自分のリンク」 */
export function Header() {
  return (
    <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 pt-4">
      <Link href="/" className="flex min-h-11 items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-coral" aria-hidden />
        <span className="font-round text-base font-bold">意見リンク</span>
      </Link>
      <Link href="/me" className="flex min-h-11 items-center rounded-full px-3 text-sm font-bold text-muted hover:text-ink">
        自分のリンク
      </Link>
    </header>
  );
}
