"use client";

import { useState } from "react";

import { REPORT_REASONS, submitReport, type ReportReason } from "@/lib/links";

/**
 * 「この募集を報告する」。押すと理由を選ぶ欄が開き、送ると運営者に届く（運営者だけが読む）。
 * 答える画面の下に、目立たないように置く
 */
export function ReportLink({ linkId }: { linkId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!reason || busy) return;
    setBusy(true);
    setError(null);
    const r = await submitReport(linkId, reason, note);
    setBusy(false);
    if (r.ok) setDone(true);
    else setError(r.message);
  }

  if (done) return <p className="text-center text-xs text-muted">報告を受け付けました。ご協力ありがとうございます。</p>;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="min-h-11 self-center px-2 text-xs text-muted hover:text-ink">
        この募集を報告する
      </button>
    );
  }

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-line bg-card p-3">
      <b className="text-sm">この募集を報告する</b>
      <p className="text-xs leading-relaxed text-muted">報告の内容は運営者のみが確認します。募集した方に通知されることはありません。</p>
      <div role="radiogroup" aria-label="報告の理由" className="flex flex-col gap-1">
        {REPORT_REASONS.map((r) => (
          <label key={r.id} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="report-reason" checked={reason === r.id} onChange={() => setReason(r.id)} className="h-4 w-4 accent-[var(--coral)]" />
            {r.label}
          </label>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="詳しい内容（任意）"
        aria-label="報告の詳しい内容"
        className="rounded-lg border border-line bg-card px-3 py-2 text-base leading-relaxed outline-none focus:border-coral"
      />
      {error && <p role="alert" className="text-xs font-bold text-coral">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} disabled={busy} className="min-h-11 flex-1 rounded-lg border border-line text-sm font-bold">
          やめる
        </button>
        <button type="button" onClick={send} disabled={!reason || busy} className="min-h-11 flex-1 rounded-lg bg-coral text-sm font-bold text-night disabled:opacity-40">
          {busy ? "送っています…" : "報告する"}
        </button>
      </div>
    </section>
  );
}
