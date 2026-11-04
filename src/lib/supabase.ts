import { createClient } from "@supabase/supabase-js";

/**
 * Supabase への接続。接続情報は .env.local の NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY。
 * どちらも公開してよい値（読み書きできる範囲は、データベースの権限設定 RLS で決まる）。秘密の鍵はここに入れない。
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * ページを開いたときの URL の # 以降。ログインから戻ってきたときの知らせ（失敗など）が入っている。
 * 下の接続を作ると、Supabase が読んで消してしまうので、その前に取っておく
 */
export const initialHash = typeof window !== "undefined" ? window.location.hash : "";

export const supabase = createClient(url ?? "http://localhost", anonKey ?? "missing", {
  auth: {
    // ブラウザではログイン状態を覚える。サーバーでは覚えない（だれのものでもない読み込みだけに使う）
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
  },
});
