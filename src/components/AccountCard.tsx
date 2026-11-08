"use client";

import Link from "next/link";
import { useState } from "react";

import { GoogleButton } from "@/components/GoogleButton";
import { continueWith, continueWithGoogle, LOGIN_PROVIDERS, signOut, switchTo, switchToGoogle, type Account, type LoginError } from "@/lib/auth";

/**
 * 「アカウント」のカード。
 * 登録済みの人にはログイン中のアカウントとログアウトを出す。
 * 登録なしで使っている人には、自分の募集の画面（compact）では登録の画面への入口を、登録の画面ではログインのボタンを出す
 */
export function AccountCard({
  account,
  loginError,
  moved,
  compact = false,
  mode = "signup",
}: {
  /** signup＝登録の画面（いまの利用者にアカウントをつなぐ）／login＝ログインの画面（登録済みのアカウントに入る） */
  mode?: "signup" | "login";
  /** 自分の募集の画面で使う：ボタンを並べず、登録の画面への入口だけを出す */
  compact?: boolean;
  account: Account;
  /** ログインから戻ってきたときの失敗（already＝そのアカウントは別の端末ですでに登録済み） */
  loginError: LoginError;
  /** ログインし直して、この端末から移した募集の数 */
  moved: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Google の公式のボタンで登録しようとしたら、そのアカウントはもう登録済みだった（画面移動がないので、ここで覚える）
  const [googleAlready, setGoogleAlready] = useState(false);
  const already: LoginError = googleAlready ? { kind: "already", provider: "google" } : loginError;

  /** Google の公式のボタンで続ける。うまくいったら、画面を読み直して自分の募集を出し直す */
  async function google(token: string, nonce: string) {
    setBusy(true);
    setError(null);
    const r = await continueWithGoogle(token, nonce);
    // うまくいったら、自分の募集の画面で出し直す
    // ログインの状態が変わったので、画面を丸ごと読み直す（前の画面の中身を残さない）
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (r === "ok") return window.location.assign("/me");
    setBusy(false);
    if (r === "already") setGoogleAlready(true);
    else setError(r);
  }

  /** 登録済みの Google のアカウントへログインし直す（この端末の募集は、読み直したあとに移す） */
  async function googleSwitch(token: string, nonce: string) {
    setBusy(true);
    setError(null);
    const message = await switchToGoogle(token, nonce);
    // この端末の募集は、自分の募集の画面を開いたときに移す
    // ログインの状態が変わったので、画面を丸ごと読み直す（前の画面の中身を残さない）
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (!message) return window.location.assign("/me");
    setBusy(false);
    setError(message);
  }

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
    if (!window.confirm("ログアウトしますか？もう一度ログインすれば、自分の募集はまた見られます。")) return;
    await signOut();
    window.location.reload();
  }

  if (account.state === "member") {
    return (
      <section className="flex flex-col gap-1.5 rounded-lg border border-line bg-card p-3">
        {moved > 0 && <p className="rounded-lg bg-leaf-tint px-3 py-2 text-sm font-bold">この端末で作った募集を {moved} 件、アカウントに移しました。</p>}
        <div className="flex items-center gap-3">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-xs text-muted">ログイン中</span>
            <b className="truncate text-sm">{account.who ?? "アカウント"}</b>
            {/* どの方法で入っても同じアカウントだと分かるように */}
            <span className="text-xs text-muted">ログインに使える方法：{account.providers.join("・")}</span>
          </span>
          <button type="button" onClick={logout} className="min-h-11 shrink-0 rounded-lg border border-line px-4 text-xs font-bold">
            ログアウト
          </button>
        </div>
      </section>
    );
  }

  if (already?.kind === "already") {
    const label = LOGIN_PROVIDERS.find((p) => p.id === already.provider)?.label;
    const switchButton = (
      <button type="button" disabled={busy} onClick={() => run(() => switchTo(already.provider))} className="min-h-11 rounded-lg bg-coral px-4 text-sm font-bold text-night disabled:opacity-50">
        {label} でログインして引き継ぐ
      </button>
    );
    return (
      <section className="flex flex-col gap-2 rounded-lg border-2 border-peach bg-card p-3">
        <b className="text-sm">この {label} アカウントは登録済みです</b>
        <p className="text-xs leading-relaxed">
          他の端末で登録されたアカウントです。ログインすると、このブラウザで投稿した募集もそのアカウントに引き継がれます。
        </p>
        {already.provider === "google" ? <GoogleButton onToken={googleSwitch} fallback={switchButton} disabled={busy} /> : switchButton}
        {error && <p role="alert" className="text-sm font-bold text-coral">{error}</p>}
      </section>
    );
  }

  // 自分の募集の画面では、登録の画面への入口だけ（コーラルの枠で、ほかのカードと分ける）
  if (compact) {
    return (
      <div className="flex flex-col gap-1.5">
        {account.state === "guest" && (
          <Link href="/signup" className="flex min-h-12 items-center justify-between gap-3 rounded-lg border-2 border-coral bg-card px-4 py-2">
            <b className="text-sm">アカウント登録</b>
            <span aria-hidden className="text-base font-bold text-coral">›</span>
          </Link>
        )}
        {/* 登録済みのアカウントを持っている人の入口 */}
        <Link href="/login" className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-line bg-card px-4 py-2">
          <span className="text-sm">
            {account.state === "guest" ? "アカウントをお持ちの方は" : ""}
            <b>ログイン</b>
          </span>
          <span aria-hidden className="text-base font-bold text-muted">›</span>
        </Link>
        {loginError?.kind === "failed" && <p role="alert" className="text-xs font-bold text-coral">ログインできませんでした。もう一度お試しください。</p>}
      </div>
    );
  }

  // ログインの画面：登録済みのアカウントに入る。この端末で登録せずに投稿した募集は、ログインしたあとにそのアカウントへ移す
  if (mode === "login") {
    return (
      <section className="flex flex-col gap-2 rounded-lg border border-line bg-card p-3 lg:p-4">
        <p className="text-xs leading-relaxed text-muted">
          {account.state === "guest"
            ? "登録済みのアカウントでログインします。このブラウザで投稿した募集と回答数は、ログインしたアカウントに引き継がれます。"
            : "登録済みのアカウントでログインします。"}
        </p>
        <div className="flex flex-col gap-2">
          {LOGIN_PROVIDERS.map((p) => {
            const button = (
              <button
                key={p.id}
                type="button"
                disabled={busy}
                onClick={() => run(() => (account.state === "guest" ? switchTo(p.id) : continueWith(p.id)))}
                className="min-h-11 flex-1 rounded-lg border border-line bg-card px-4 text-sm font-bold hover:border-coral disabled:opacity-50"
              >
                {p.label} でログイン
              </button>
            );
            return p.id === "google" ? <GoogleButton key={p.id} onToken={googleSwitch} fallback={button} disabled={busy} /> : button;
          })}
        </div>
        {error && <p role="alert" className="text-sm font-bold text-coral">{error}</p>}
      </section>
    );
  }

  // 登録の画面：よくあるサービスと同じく、短い説明とボタンだけにする（見出しは画面の「アカウント登録」）
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-line bg-card p-4 lg:p-5">
      <p className="text-sm leading-relaxed text-muted">
        {account.state === "guest" ? "現在の募集と回答数は、登録したアカウントに引き継がれます。" : "登録済みのアカウントでログインすると、自分の募集を確認できます。"}
      </p>
      <div className="flex flex-col gap-2">
        {LOGIN_PROVIDERS.map((p) => {
          const button = (
            <button
              key={p.id}
              type="button"
              disabled={busy}
              onClick={() => run(() => continueWith(p.id))}
              className="min-h-11 flex-1 rounded-lg border border-line bg-card px-4 text-sm font-bold hover:border-coral disabled:opacity-50"
            >
              {p.label} で続ける
            </button>
          );
          // Google は公式のボタンにする（Google の画面に、意見リンクの住所が出る）。使えないときは、これまでのボタン
          return p.id === "google" ? <GoogleButton key={p.id} onToken={google} fallback={button} disabled={busy} /> : button;
        })}
      </div>
      {loginError?.kind === "failed" && <p role="alert" className="text-sm font-bold text-coral">ログインできませんでした。もう一度お試しください。</p>}
      {error && <p role="alert" className="text-sm font-bold text-coral">{error}</p>}
      <Consent />
    </section>
  );
}

/** 登録・ログインのボタンの下に小さく出す、利用規約とプライバシーポリシーへの同意 */
function Consent() {
  return (
    <p className="text-[11px] leading-relaxed text-muted">
      登録すると、
      <Link href="/terms" className="underline underline-offset-2">利用規約</Link>
      および
      <Link href="/privacy" className="underline underline-offset-2">プライバシーポリシー</Link>
      に同意したものとみなされます。
    </p>
  );
}
