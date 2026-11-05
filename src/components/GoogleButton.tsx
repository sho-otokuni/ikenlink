"use client";

import { useEffect, useRef, useState } from "react";

import { GOOGLE_CLIENT_ID, loadGoogle, makeNonce } from "@/lib/google";

/**
 * Google の公式のログインボタン。押すと Google の小さな画面が開き、選んだアカウントの証明（ID トークン）を onToken に渡す。
 * ボタンの見た目は Google が決める（Google の決まりで、色や文字は変えられない）。
 * 読み込めなかったときは fallback（これまでのボタン）を出す
 */
export function GoogleButton({
  onToken,
  fallback,
  disabled = false,
}: {
  onToken: (token: string, nonce: string) => void;
  fallback: React.ReactNode;
  disabled?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(!GOOGLE_CLIENT_ID);
  // 押されたときに最新の onToken を呼ぶ（Google の仕組みは1回だけ初期化する）
  const handler = useRef(onToken);
  useEffect(() => {
    handler.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let alive = true;
    (async () => {
      try {
        const [google, nonce] = await Promise.all([loadGoogle(), makeNonce()]);
        if (!alive || !box.current) return;
        google.initialize({
          client_id: GOOGLE_CLIENT_ID,
          nonce: nonce.hashed,
          callback: (r) => handler.current(r.credential, nonce.raw),
          use_fedcm_for_button: true,
        });
        const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        google.renderButton(box.current, {
          type: "standard",
          theme: dark ? "filled_black" : "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: Math.min(400, Math.max(200, Math.round(box.current.clientWidth))),
          locale: "ja",
        });
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (failed) return <>{fallback}</>;
  return (
    // 処理中は押せないようにする（Google のボタンは中の作りを変えられないので、上から覆う）
    <div className={`relative flex min-h-11 flex-1 items-center justify-center ${disabled ? "pointer-events-none opacity-50" : ""}`}>
      <div ref={box} className="flex w-full justify-center" />
    </div>
  );
}
