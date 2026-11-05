/**
 * Google の公式のログインボタン（Google Identity Services）。
 * Supabase を経由する画面移動のログインだと、Google の画面に Supabase の住所（〜.supabase.co）が出て怪しく見える。
 * 公式のボタンなら、意見リンク自身の住所が出る。Google から受け取った証明（ID トークン）を Supabase に渡してログインする。
 *
 * 使うには .env.local（と Vercel の環境変数）に NEXT_PUBLIC_GOOGLE_CLIENT_ID を入れる（公開してよい値）。
 * 入っていないときは、これまでの画面移動のログインを使う
 */

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

type CredentialResponse = { credential: string };

type GoogleId = {
  initialize(options: {
    client_id: string;
    callback: (r: CredentialResponse) => void;
    nonce: string;
    auto_select?: boolean;
    use_fedcm_for_button?: boolean;
  }): void;
  renderButton(
    el: HTMLElement,
    options: { type: "standard"; theme: "outline" | "filled_black"; size: "large"; text: "continue_with" | "signin_with"; shape: "rectangular"; width: number; locale: string },
  ): void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

let loading: Promise<GoogleId> | null = null;

/** Google のボタンの仕組みを読み込む（1回だけ） */
export function loadGoogle(): Promise<GoogleId> {
  loading ??= new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(window.google.accounts.id);
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => (window.google?.accounts?.id ? resolve(window.google.accounts.id) : reject(new Error("google")));
    s.onerror = () => {
      loading = null;
      reject(new Error("google"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/**
 * 使い捨ての合言葉（nonce）。Google にはハッシュを、Supabase には元の値を渡し、
 * 受け取った証明が「このボタンを押したときのもの」だと Supabase が確かめられるようにする
 */
export async function makeNonce(): Promise<{ raw: string; hashed: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return { raw, hashed };
}
