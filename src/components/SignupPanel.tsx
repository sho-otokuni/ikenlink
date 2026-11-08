"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AccountCard } from "@/components/AccountCard";
import { getAccount, type Account } from "@/lib/auth";

/**
 * 登録なしと登録ありで、できることの違い。
 * ○＝できる／△＝条件つきでできる／×＝できない。note は記号の下に小さく添える説明
 */
type Mark = "yes" | "partly" | "no";
type Cell = { mark: Mark; note?: string };
const COMPARE: { label: string; guest: Cell; member: Cell }[] = [
  { label: "募集の投稿", guest: { mark: "yes" }, member: { mark: "yes" } },
  { label: "他の募集への回答", guest: { mark: "yes" }, member: { mark: "yes" } },
  { label: "集まった意見の閲覧", guest: { mark: "partly", note: "このブラウザのみ" }, member: { mark: "yes", note: "すべての端末から" } },
  { label: "回答履歴の閲覧", guest: { mark: "no" }, member: { mark: "yes" } },
  { label: "データの保持", guest: { mark: "partly", note: "ブラウザに依存" }, member: { mark: "yes", note: "アカウントに保存" } },
];

const MARK_LABEL: Record<Mark, string> = { yes: "利用可", partly: "一部制限あり", no: "利用不可" };

/** ○・△・× の線画。できる（○）だけコーラルの太い線にし、ほかは色を付けない */
function MarkIcon({ mark }: { mark: Mark }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={mark === "yes" ? 3 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {mark === "yes" && <circle cx="12" cy="12" r="8" />}
      {mark === "partly" && <path d="M12 4.5l8 14H4z" />}
      {mark === "no" && <path d="M6 6l12 12M18 6L6 18" />}
    </svg>
  );
}

function CellView({ cell }: { cell: Cell }) {
  return (
    <span className="flex flex-col items-center gap-0.5 text-center">
      <span className={cell.mark === "yes" ? "text-coral" : "text-ink"}>
        <MarkIcon mark={cell.mark} />
      </span>
      <span className="sr-only">{MARK_LABEL[cell.mark]}</span>
      {cell.note && <span className="text-[11px] leading-snug lg:text-xs">{cell.note}</span>}
    </span>
  );
}

/** 登録なしと登録ありの違いを、○△× の表で並べる（どちらかを推さないよう、2つの列は同じ決まりで出す） */
function Compare() {
  const cell = "border-t border-line p-2.5 leading-snug lg:p-3";
  return (
    <div className="flex flex-col gap-1.5">
      <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-lg border border-line bg-card text-left text-xs lg:text-sm">
        <thead>
          <tr>
            <th scope="col" className="w-[40%] p-2.5 lg:p-3">
              <span className="sr-only">機能</span>
            </th>
            <th scope="col" className="w-[30%] p-2.5 text-center font-bold lg:p-3">未登録</th>
            <th scope="col" className="w-[30%] p-2.5 text-center font-bold lg:p-3">登録済み</th>
          </tr>
        </thead>
        <tbody>
          {COMPARE.map((row) => (
            <tr key={row.label}>
              <th scope="row" className={`${cell} font-bold`}>{row.label}</th>
              <td className={cell}>
                <CellView cell={row.guest} />
              </td>
              <td className={cell}>
                <CellView cell={row.member} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-muted">○ 利用可　△ 一部制限あり　× 利用不可</p>
    </div>
  );
}

/** ログイン済みの人に出す案内 */
function AlreadyIn({ account }: { account: Extract<Account, { state: "member" }> }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-line bg-card p-4">
      <b className="text-sm">ログイン済みです</b>
      <p className="text-xs text-muted">ログイン中のアカウント：{account.who ?? "アカウント"}</p>
      <Link href="/me" className="flex min-h-11 items-center rounded-lg bg-coral px-5 text-sm font-bold text-night">
        自分の募集へ
      </Link>
    </div>
  );
}

function useAccount() {
  const [account, setAccount] = useState<Account | null>(null);
  useEffect(() => {
    let alive = true;
    getAccount().then((a) => alive && setAccount(a));
    return () => {
      alive = false;
    };
  }, []);
  return account;
}

/** アカウント登録の画面の中身。登録済みの人には、自分の募集への案内を出す */
export function SignupPanel() {
  const account = useAccount();
  if (!account) return <div className="h-40 rounded-lg bg-line" aria-busy />;
  if (account.state === "member") return <AlreadyIn account={account} />;

  return (
    <div className="flex flex-col gap-4">
      <AccountCard account={account} loginError={null} moved={0} />
      <Link href="/login" className="flex min-h-11 items-center self-start text-sm font-bold text-coral">
        アカウントをお持ちの方はログイン ›
      </Link>
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold">登録の有無による機能の違い</h2>
        <Compare />
      </section>
    </div>
  );
}

/** ログインの画面の中身。登録済みの人には、自分の募集への案内を出す */
export function LoginPanel() {
  const account = useAccount();
  if (!account) return <div className="h-40 rounded-lg bg-line" aria-busy />;
  if (account.state === "member") return <AlreadyIn account={account} />;

  return (
    <div className="flex flex-col gap-4">
      <AccountCard account={account} loginError={null} moved={0} mode="login" />
      <Link href="/signup" className="flex min-h-11 items-center self-start text-sm font-bold text-coral">
        アカウントをお持ちでない方は新規登録 ›
      </Link>
    </div>
  );
}
