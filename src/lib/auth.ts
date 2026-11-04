import { initialHash, isSupabaseConfigured, supabase } from "@/lib/supabase";

/**
 * アカウント登録・ログイン（Google・X・GitHub）。
 * 登録しなくても使える（登録なしの「匿名ログイン」）。登録すると、どの端末からでも自分のリンクを見られる。
 *
 * - 登録なしで使っている人が登録する：いまの利用者に Google などをつなぐ（作った募集も答えた数もそのまま）
 * - そのアカウントが別の端末ですでに登録済みだった：ログインし直す。この端末で作った募集は、合言葉で移す
 */

export type LoginProvider = "google" | "x" | "github";

export const LOGIN_PROVIDERS: { id: LoginProvider; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "x", label: "X" },
  { id: "github", label: "GitHub" },
];

/** none＝まだ何も使っていない／guest＝登録なしで使っている／member＝登録済み */
export type Account =
  | { state: "none" }
  | { state: "guest" }
  | { state: "member"; provider: string; name: string | null };

/** ログインし直す前にもらった合言葉（ログインから戻ってきたら、これで募集を移す） */
const TRANSFER_KEY = "iken-link:transfer";
/** 最後に選んだログイン方法（「登録済みだった」と戻ってきたとき、同じ方法でログインし直すため） */
const PROVIDER_KEY = "iken-link:provider";

export async function getAccount(): Promise<Account> {
  if (!isSupabaseConfigured) return { state: "none" };
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return { state: "none" };
  if (user.is_anonymous) return { state: "guest" };
  // 同じメールアドレスの Google と X などは、Supabase が1つのアカウントにまとめる。つながっている方法を全部出す
  const providers = (user.identities ?? []).map((i) => LOGIN_PROVIDERS.find((p) => p.id === i.provider)?.label ?? i.provider);
  const meta = user.user_metadata as { email?: string; user_name?: string; full_name?: string; name?: string };
  return {
    state: "member",
    provider: [...new Set(providers)].join("・"),
    name: user.email ?? meta.email ?? meta.user_name ?? meta.full_name ?? meta.name ?? null,
  };
}

/** ログインから戻ってくる場所（自分のリンクの画面） */
function returnUrl() {
  return `${window.location.origin}/me`;
}

/**
 * 「〇〇で続ける」。登録なしで使っているなら、いまの利用者にアカウントをつなぐ（何も引き継がなくてよい）。
 * まだ何も使っていないなら、ふつうにログインする
 */
export async function continueWith(provider: LoginProvider): Promise<string | null> {
  const account = await getAccount();
  const options = { redirectTo: returnUrl() };
  try {
    window.sessionStorage.setItem(PROVIDER_KEY, provider);
  } catch {
    // 覚えておけなくても、ログインはできる
  }
  const { error } =
    account.state === "guest"
      ? await supabase.auth.linkIdentity({ provider, options })
      : await supabase.auth.signInWithOAuth({ provider, options });
  return error ? "ログインを始められませんでした。通信環境を確かめて、もう一度お試しください" : null;
}

/**
 * すでに登録済みのアカウントへログインし直す。この端末で登録なしのまま作った募集と答えた記録は、
 * 合言葉をもらっておき、戻ってきてから移す
 */
export async function switchTo(provider: LoginProvider): Promise<string | null> {
  const account = await getAccount();
  if (account.state === "guest") {
    const { data: token } = await supabase.rpc("create_transfer");
    if (typeof token === "string") {
      try {
        window.localStorage.setItem(TRANSFER_KEY, token);
      } catch {
        // 覚えておけなくても、ログイン自体はできる（この端末の募集は移らない）
      }
    }
  }
  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: returnUrl() } });
  return error ? "ログインを始められませんでした。通信環境を確かめて、もう一度お試しください" : null;
}

/**
 * 移した結果。画面がすぐに読み直しても（開発中の二重の呼び出しなど）同じ数を出せるよう、少しの間だけ覚えておく。
 * あとで別の画面から戻ってきたときは、もう合言葉がないので 0 になる
 */
let switchResult: { at: number; moved: Promise<number> } | null = null;

/** ログインから戻ってきたあと：合言葉があれば、この端末の募集を移す。移した数を返す */
export function finishSwitch(): Promise<number> {
  if (switchResult && Date.now() - switchResult.at < 5000) return switchResult.moved;
  const moved = (async () => {
    let token: string | null = null;
    try {
      token = window.localStorage.getItem(TRANSFER_KEY);
    } catch {
      return 0;
    }
    if (!token || (await getAccount()).state !== "member") return 0;
    const { data, error } = await supabase.rpc("claim_transfer", { p_token: token });
    if (!error) window.localStorage.removeItem(TRANSFER_KEY);
    return error ? 0 : Number(data ?? 0);
  })();
  switchResult = { at: Date.now(), moved };
  return moved;
}

export type LoginError = { kind: "already"; provider: LoginProvider } | { kind: "failed" } | null;

/** ページを開いたときの URL を、もう読んだか（あとで画面を移ってきたときに、同じ知らせを出さないため） */
let initialRead = false;

/**
 * ログインから戻ってきた URL に付いている失敗の知らせ。
 * already＝そのアカウントは別の端末ですでに登録済み（ログインし直すか選んでもらう）。
 * 読んだ知らせは、URL から消して、その画面の履歴（history.state）に残す。
 * 同じ画面で読み直すと同じ知らせを返し、別の画面から移ってきたときは何も返さない
 */
export function readLoginError(): LoginError {
  const saved = (window.history.state as { ikenLoginError?: LoginError } | null)?.ikenLoginError;
  if (saved !== undefined || initialRead) return saved ?? null;
  initialRead = true;
  const params = new URLSearchParams(initialHash.slice(1) || window.location.search);
  const code = params.get("error_code");
  if (!code && !params.get("error")) return null;
  let provider: string | null = null;
  try {
    provider = window.sessionStorage.getItem(PROVIDER_KEY);
  } catch {
    // 読めなければ、選び直してもらう
  }
  const known = LOGIN_PROVIDERS.find((p) => p.id === provider)?.id;
  const result: LoginError = code === "identity_already_exists" && known ? { kind: "already", provider: known } : { kind: "failed" };
  // Next.js も履歴を使うので、元の中身は残して足す
  window.history.replaceState({ ...window.history.state, ikenLoginError: result }, "", window.location.pathname);
  return result;
}

export async function signOut() {
  await supabase.auth.signOut();
}
