"use client";

import { useState } from "react";

import { continueWith, LOGIN_PROVIDERS, signOut, switchTo, type Account, type LoginError } from "@/lib/auth";

/**
 * 自分のリンクの画面の「アカウント」。
 * 登録なしで使っている人には登録をすすめ、登録済みの人にはログイン中のアカウントとログアウトを出す
 */
export function AccountCard({
  account,
  loginError,
  moved,
}: {
  account: Account;
  /** ログインから戻ってきたときの失敗（already＝そのアカウントは別の端末ですでに登録済み） */
  loginError: LoginError;
  /** ログインし直して、この端末から移した募集の数 */
  moved: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<string | null>) {
    setBusy(true);
    setError(null);
    const message = await action();
    // うまくいけば、ログインの画面へ移るので戻ってこない
    if (message) {
      setBusy(false);
      setError(message);
    }
  }

  async function logout() {
    if (!window.confirm("ログアウトしますか？もう一度ログインすれば、自分のリンクはまた見られます。")) return;
    await signOut();
    window.location.reload();
  }

  if (account.state === "member") {
    return (
      <section className="flex flex-col gap-1.5 rounded-2xl border border-line bg-card p-3">
        {moved > 0 && <p className="rounded-xl bg-leaf-tint px-3 py-2 text-sm font-bold">この端末で作った募集を {moved} 件、アカウントに移しました。</p>}
        <div className="flex items-center gap-3">
          <span className="flex flex-1 flex-col">
            <b className="text-sm">{account.provider} でログインしています</b>
            {account.name && <span className="text-xs text-muted">{account.name}</span>}
            <span className="text-xs text-muted">どの端末からでも、ログインすれば自分のリンクを見られます。</span>
          </span>
          <button type="button" onClick={logout} className="min-h-11 shrink-0 rounded-full border border-line px-4 text-xs font-bold">
            ログアウト
          </button>
        </div>
      </section>
    );
  }

  if (loginError?.kind === "already") {
    const label = LOGIN_PROVIDERS.find((p) => p.id === loginError.provider)?.label;
    return (
      <section className="flex flex-col gap-2 rounded-2xl border-2 border-peach bg-peach-tint p-3">
        <b className="text-sm">その {label} のアカウントは、もう登録されています</b>
        <p className="text-xs leading-relaxed">
          ほかの端末で登録したアカウントです。ログインすると、この端末で登録なしのまま作った募集も、そのアカウントに移します。
        </p>
        <button type="button" disabled={busy} onClick={() => run(() => switchTo(loginError.provider))} className="min-h-11 rounded-full bg-coral px-4 text-sm font-bold text-night disabled:opacity-50">
          {label} でログインして、募集を移す
        </button>
        {error && <p role="alert" className="text-sm font-bold text-coral">{error}</p>}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-3">
      <b className="text-sm">{account.state === "guest" ? "アカウントを作って、どの端末からでも見られるように" : "ログイン"}</b>
      <p className="text-xs leading-relaxed text-muted">
        {account.state === "guest"
          ? "いまは登録なしで使っています。作った募集はこのブラウザにだけ残ります。アカウントを作ると、ほかのスマホやパソコンからもログインして見られます。いまの募集も答えた数も、そのまま引き継ぎます。"
          : "前に作ったアカウントがあれば、ログインすると自分のリンクが見られます。登録しなくても、募集は作れます。"}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        {LOGIN_PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={busy}
            onClick={() => run(() => continueWith(p.id))}
            className="min-h-11 flex-1 rounded-full border border-line bg-card px-4 text-sm font-bold hover:border-coral disabled:opacity-50"
          >
            {p.label} で続ける
          </button>
        ))}
      </div>
      {loginError?.kind === "failed" && <p role="alert" className="text-sm font-bold text-coral">ログインできませんでした。もう一度お試しください。</p>}
      {error && <p role="alert" className="text-sm font-bold text-coral">{error}</p>}
    </section>
  );
}
