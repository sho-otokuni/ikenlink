"use client";

import { useState } from "react";

import { CharCount } from "@/components/CharCount";
import { setDisplayName } from "@/lib/auth";

/**
 * プロフィール（いまは「表示名」だけ）。
 * 募集を作るときに自動で入り、答える人には「〇〇さんが意見を募集しています」と出る
 */
export function ProfileCard({ initialName, onSaved }: { initialName: string; /** 保存できたときに、新しい名前を知らせる */ onSaved?: (name: string) => void }) {
  const [name, setName] = useState(initialName);
  const [saved, setSaved] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const changed = name.trim() !== saved;

  async function save() {
    if (!changed || !name.trim() || busy) return;
    setBusy(true);
    setMessage(null);
    const error = await setDisplayName(name);
    setBusy(false);
    if (error) return setMessage({ ok: false, text: error });
    setSaved(name.trim());
    onSaved?.(name.trim());
    setMessage({ ok: true, text: "保存しました。次に募集を作るときから、この名前が入ります。" });
  }

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-line bg-card p-3">
      <label className="flex flex-col gap-1">
        <span className="flex items-baseline text-xs font-bold">
          表示名
          <CharCount value={name} max={20} />
        </span>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            maxLength={20}
            placeholder="例：はなこ"
            aria-label="表示名"
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-card px-3 text-base outline-none focus:border-coral"
          />
          <button type="button" onClick={save} disabled={!changed || !name.trim() || busy} className="min-h-11 shrink-0 rounded-lg bg-coral px-4 text-sm font-bold text-night disabled:opacity-40">
            保存
          </button>
        </div>
      </label>
      <p className="text-xs leading-relaxed text-muted">募集を作るときに自動で入ります。答える人には「〇〇さんが意見を募集しています」と出ます。</p>
      {message && (
        <p role={message.ok ? "status" : "alert"} className={`text-xs font-bold ${message.ok ? "text-leaf-dark" : "text-coral"}`}>
          {message.text}
        </p>
      )}
    </section>
  );
}
