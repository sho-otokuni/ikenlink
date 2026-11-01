import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Answers, FeedbackLink, Question } from "@/lib/types";

type Result<T> = { ok: true; data: T } | { ok: false; message: string };
const NETWORK = "通信環境を確かめて、もう一度お試しください";
const NOT_READY = "まだデータベースにつながっていません（.env.local の設定待ち）";

/** 作った人が見る、リンクと届いた意見 */
export type MyLink = FeedbackLink & { createdAt: string; responseCount: number; lastResponseAt: string | null };
export type Response = { id: string; answers: Answers; createdAt: string };
/** 意見を見る画面に出すもの。adminToken は、作った人が自分の端末で開いたときだけ入る */
export type Results = { link: FeedbackLink; responses: Response[]; adminToken: string | null };

type LinkRow = {
  id: string;
  title: string;
  tagline: string | null;
  url: string | null;
  images: string[];
  questions: Question[];
  maker_name: string;
  created_at: string;
};

const LINK_COLUMNS = "id, title, tagline, url, images, questions, maker_name, created_at";

function toLink(row: LinkRow): FeedbackLink {
  return {
    id: row.id,
    title: row.title,
    tagline: row.tagline,
    url: row.url,
    images: row.images ?? [],
    questions: row.questions ?? [],
    makerName: row.maker_name,
  };
}

// ============================================================
// 答える人（ログインなし）
// ============================================================

/** 答える画面に出すリンク。見つからなければ null */
export async function getLink(id: string): Promise<FeedbackLink | null> {
  if (!isSupabaseConfigured || !/^[a-z0-9]{1,16}$/.test(id)) return null;
  const { data } = await supabase.from("links").select(LINK_COLUMNS).eq("id", id).maybeSingle<LinkRow>();
  return data ? toLink(data) : null;
}

/** 意見を送る（だれが送ったかは残さない） */
export async function submitResponse(linkId: string, answers: Answers): Promise<Result<null>> {
  if (!isSupabaseConfigured) return { ok: false, message: NOT_READY };
  const cleaned = Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v.trim().slice(0, 500)]).filter(([, v]) => v));
  const { error } = await supabase.from("responses").insert({ link_id: linkId, answers: cleaned });
  if (error?.message.includes("too_many_responses")) return { ok: false, message: "いま意見が集中しています。少し待ってから、もう一度送ってください" };
  if (error) return { ok: false, message: `送れませんでした。${NETWORK}` };
  return { ok: true, data: null };
}

// ============================================================
// 作る人
// ============================================================

/**
 * ログインしていなければ、登録なしの「匿名ログイン」で始める（同じブラウザなら、次からも同じ人として扱われる）。
 * あとでメールアドレスにつなげられるようにする予定
 */
async function ensureUser(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: signed, error } = await supabase.auth.signInAnonymously();
  if (error || !signed.user) return null;
  return signed.user.id;
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/** 短くて推測されにくい id（URL の最後に付く） */
function newId() {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(8)), (n) => chars[n % chars.length]).join("");
}

/** 管理用の URL の合言葉（推測できない32文字） */
function newToken() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) => chars[n % chars.length]).join("");
}

async function dataUrlToBlob(dataUrl: string) {
  return (await fetch(dataUrl)).blob();
}

export type LinkDraft = Omit<FeedbackLink, "id">;

/** リンクを作る。画面の写真（data URL）は保存場所に置いて、その URL を残す */
export async function createLink(draft: LinkDraft): Promise<Result<string>> {
  if (!isSupabaseConfigured) return { ok: false, message: NOT_READY };
  const uid = await ensureUser();
  if (!uid) return { ok: false, message: `始められませんでした。${NETWORK}` };
  const id = newId();
  const images: string[] = [];
  for (const [i, src] of draft.images.entries()) {
    const path = `${uid}/${id}/${i + 1}.jpg`;
    const { error } = await supabase.storage.from("link-images").upload(path, await dataUrlToBlob(src), { contentType: "image/jpeg" });
    if (error) return { ok: false, message: `写真を保存できませんでした。${NETWORK}` };
    images.push(supabase.storage.from("link-images").getPublicUrl(path).data.publicUrl);
  }
  const { error } = await supabase.from("links").insert({
    id,
    title: draft.title,
    tagline: draft.tagline,
    url: draft.url,
    images,
    questions: draft.questions,
    maker_name: draft.makerName,
  });
  if (error) return { ok: false, message: `リンクを作れませんでした。${NETWORK}` };
  // 管理用の URL の合言葉（ほかの端末から意見を見るため）。失敗しても、この端末からは見られるので続ける
  await supabase.from("link_secrets").insert({ link_id: id, admin_token: newToken() });
  return { ok: true, data: id };
}

/** 自分のリンクの一覧（新しい順）。まだ何も作っていない人は空 */
export async function fetchMyLinks(): Promise<Result<MyLink[]>> {
  if (!isSupabaseConfigured) return { ok: false, message: NOT_READY };
  const uid = await currentUserId();
  if (!uid) return { ok: true, data: [] };
  const [{ data, error }, { data: stats }] = await Promise.all([
    supabase.from("links").select(LINK_COLUMNS).eq("owner_id", uid).order("created_at", { ascending: false }).returns<LinkRow[]>(),
    supabase.rpc("my_link_stats"),
  ]);
  if (error || !data) return { ok: false, message: `読み込めませんでした。${NETWORK}` };
  const byLink = new Map<string, { response_count: number; last_response_at: string | null }>(
    ((stats ?? []) as { link_id: string; response_count: number; last_response_at: string | null }[]).map((s) => [s.link_id, s]),
  );
  return {
    ok: true,
    data: data.map((row) => ({
      ...toLink(row),
      createdAt: row.created_at,
      responseCount: Number(byLink.get(row.id)?.response_count ?? 0),
      lastResponseAt: byLink.get(row.id)?.last_response_at ?? null,
    })),
  };
}

/** 自分のリンク1本と、届いた意見（新しい順）。自分のものでなければ null */
export async function fetchResults(id: string): Promise<Result<Results | null>> {
  if (!isSupabaseConfigured) return { ok: false, message: NOT_READY };
  const uid = await currentUserId();
  if (!uid) return { ok: true, data: null };
  const [{ data: row, error }, { data: rows }, { data: secret }] = await Promise.all([
    supabase.from("links").select(LINK_COLUMNS).eq("id", id).eq("owner_id", uid).maybeSingle<LinkRow>(),
    supabase.from("responses").select("id, answers, created_at").eq("link_id", id).order("created_at", { ascending: false }),
    supabase.from("link_secrets").select("admin_token").eq("link_id", id).maybeSingle<{ admin_token: string }>(),
  ]);
  if (error) return { ok: false, message: `読み込めませんでした。${NETWORK}` };
  if (!row) return { ok: true, data: null };
  return {
    ok: true,
    data: {
      link: toLink(row),
      responses: ((rows ?? []) as { id: string; answers: Answers; created_at: string }[]).map((r) => ({ id: r.id, answers: r.answers, createdAt: r.created_at })),
      adminToken: secret?.admin_token ?? null,
    },
  };
}

/** 管理用の URL（合言葉）で、どの端末からでも意見を見る。合言葉が違えば null */
export async function fetchResultsByToken(id: string, token: string): Promise<Result<Results | null>> {
  if (!isSupabaseConfigured) return { ok: false, message: NOT_READY };
  const { data, error } = await supabase.rpc("results_by_token", { p_link: id, p_token: token });
  if (error) return { ok: false, message: `読み込めませんでした。${NETWORK}` };
  if (!data) return { ok: true, data: null };
  const d = data as { link: LinkRow; responses: { id: string; answers: Answers; created_at: string }[] };
  return {
    ok: true,
    data: {
      link: toLink(d.link),
      responses: d.responses.map((r) => ({ id: r.id, answers: r.answers, createdAt: r.created_at })),
      adminToken: null,
    },
  };
}

/** リンクを消す（届いた意見と、画面の写真も消える） */
export async function deleteLink(id: string): Promise<Result<null>> {
  const uid = await currentUserId();
  if (!uid) return { ok: false, message: "ログインし直してください" };
  const { data: files } = await supabase.storage.from("link-images").list(`${uid}/${id}`);
  if (files?.length) await supabase.storage.from("link-images").remove(files.map((f) => `${uid}/${id}/${f.name}`));
  const { error } = await supabase.from("links").delete().eq("id", id);
  return error ? { ok: false, message: `消せませんでした。${NETWORK}` } : { ok: true, data: null };
}
