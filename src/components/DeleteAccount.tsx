"use client";

import { useState } from "react";

import { deleteAccount, type Account } from "@/lib/auth";

/**
 * アカウントの削除。元に戻せないので、何が消えるかを見せ、「削除する」と打ってもらってから消す。
 * 登録なしで使っている人も、このブラウザの利用者とデータを消せる
 */
export function DeleteAccount({ account }: { account: Account }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const word = "削除する";

  async function run() {
    if (typed !== word || busy) return;
    setBusy(true);
    setError(null);
    const message = await deleteAccount();
    if (message) {
      setBusy(false);
      return setError(message);
    }
    // 前の画面の状態が残らないよう、ページを読み込み直してはじめの画面へ
    window.location.replace(window.location.origin);
  }

  if (account.state === "none") return null;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="min-h-11 self-start px-1 text-xs text-muted underline-offset-4 hover:text-coral hover:underline">
        {account.state === "member" ? "アカウントを削除する" : "このブラウザのデータを削除する"}
      </button>
    );
  }
  return (
    <section className="flex flex-col gap-2 rounded-lg border-2 border-coral bg-card p-3">
      <h2 className="text-sm font-bold">{account.state === "member" ? "アカウントを削除する" : "このブラウザのデータを削除する"}</h2>
      <ul className="flex list-disc flex-col gap-0.5 pl-5 text-xs leading-relaxed">
        <li>作った募集と、届いた意見がすべて消えます</li>
        <li>募集に貼った画像も消えます。送ったリンクを開いても、答えられなくなります</li>
        <li>ほかの意見に答えた内容は残りますが、あなたが答えたという記録は消えます</li>
        <li>元に戻せません</li>
      </ul>
      <label className="flex flex-col gap-1 text-xs font-bold">
        よければ「{word}」と入力してください
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          aria-label={`確認のため「${word}」と入力`}
          className="min-h-11 rounded-lg border border-line bg-card px-3 text-base font-normal outline-none focus:border-coral"
        />
      </label>
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} disabled={busy} className="min-h-11 flex-1 rounded-lg border border-line bg-card text-sm font-bold">
          やめる
        </button>
        <button type="button" onClick={run} disabled={typed !== word || busy} className="min-h-11 flex-1 rounded-lg bg-coral text-sm font-bold text-night disabled:opacity-40">
          {busy ? "削除しています…" : "削除する"}
        </button>
      </div>
      {error && <p role="alert" className="text-sm font-bold text-coral">{error}</p>}
    </section>
  );
}
