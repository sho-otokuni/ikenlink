import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Answers, FeedbackLink, LinkKind, Question } from "@/lib/types";

type Result<T> = { ok: true; data: T } | { ok: false; message: string };
const NETWORK = "通信環境を確かめて、もう一度お試しください";
const NOT_READY = "まだデータベースにつながっていません（.env.local の設定待ち）";

/** 作った人が見る、リンクと届いた意見 */
export type MyLink = FeedbackLink & { createdAt: string; isPublic: boolean; responseCount: number; lastResponseAt: string | null };
export type Response = { id: string; answers: Answers; createdAt: string };
/** 意見を見る画面に出すもの。adminToken と isPublic は、作った人が自分の端末で開いたときだけ入る */
export type Results = { link: FeedbackLink; responses: Response[]; adminToken: string | null; isPublic: boolean | null };
/** みんなの募集の一覧の1件（届いた意見の中身は出さず、数だけ）。ownerAnswered は募集した人がほかの募集に答えた数 */
export type PublicLink = {
  id: string;
  kind: LinkKind;
  title: string;
  image: string | null;
  makerName: string;
  responseCount: number;
  createdAt: string;
  closesAt: string | null;
  ownerAnswered: number;
};

type LinkRow = {
  id: string;
  kind: LinkKind | null;
  closes_at: string | null;
  title: string;
  tagline: string | null;
  url: string | null;
  urls?: string[] | null;
  images: string[];
  image_captions?: string[] | null;
  questions: Question[];
  maker_name: string;
  created_at: string;
  is_public?: boolean;
};

const LINK_COLUMNS = "id, kind, title, tagline, url, urls, images, image_captions, questions, maker_name, created_at, closes_at, is_public";

function toLink(row: LinkRow): FeedbackLink {
  return {
    id: row.id,
    kind: row.kind ?? "other",
    title: row.title,
    tagline: row.tagline,
    // 前の版で作った募集は、url（1つ）だけを持っている
    urls: row.urls?.length ? row.urls : row.url ? [row.url] : [],
    images: row.images ?? [],
    // images と同じ数にそろえる（タイトルを付けられるようになる前の募集は、空のまま）
    imageCaptions: (row.images ?? []).map((_, i) => row.image_captions?.[i] ?? ""),
    questions: row.questions ?? [],
    makerName: row.maker_name,
    closesAt: row.closes_at ?? null,
  };
}

// ============================================================
// 答える人（ログインなし）
// ============================================================

/** 答える画面に出すリンク。見つからなければ null */
export async function getLink(id: string): Promise<FeedbackLink | null> {
  if (!isSupabaseConfigured || !/^[a-z0-9]{1,16}$/.test(id)) return null;
  // 募集の表は持ち主しか読めない（「リンクを知っている人だけ」を一覧されないため）。id を知っている人は、この関数から1件だけ読める
  const { data } = await supabase.rpc("get_link", { p_id: id });
  return data ? toLink(data as LinkRow) : null;
}

/**
 * 意見を送る。募集した人には、だれが送ったかは見せない。
 * 答えた数を数えるため、登録なしの匿名ログインで送る（始められなくても、意見は送れるようにする）
 */
export async function submitResponse(linkId: string, answers: Answers): Promise<Result<null>> {
  if (!isSupabaseConfigured) return { ok: false, message: NOT_READY };
  await ensureUser();
  const cleaned = Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v.trim().slice(0, 500)]).filter(([, v]) => v));
  const { error } = await supabase.from("responses").insert({ link_id: linkId, answers: cleaned });
  if (error?.message.includes("too_many_responses")) return { ok: false, message: "いま意見が集中しています。少し待ってから、もう一度送ってください" };
  if (error?.message.includes("invalid_answers")) return { ok: false, message: "送れない内容が入っていました。ページを読み込み直して、もう一度お試しください" };
  // 締め切りを過ぎていると、データベースの権限で断られる
  if (error?.code === "42501") return { ok: false, message: "この募集は締め切られました" };
  if (error) return { ok: false, message: `送れませんでした。${NETWORK}` };
  return { ok: true, data: null };
}

/** ほかの募集に答えた数（中身のある答えだけ。同じ募集は1件）。まだ始めていない人は0 */
export async function fetchMyAnswerCount(): Promise<number> {
  if (!isSupabaseConfigured || !(await currentUserId())) return 0;
  const { data } = await supabase.rpc("my_answer_count");
  return Number(data ?? 0);
}

/** 自分が答えた意見1件（答えた募集の、タイトルと質問も一緒に） */
export type MyAnswer = {
  id: string;
  answeredAt: string;
  answers: Answers;
  link: { id: string; title: string; kind: LinkKind; image: string | null; questions: Question[]; makerName: string };
};

/** 自分がこれまでに答えた意見（新しい順）。アカウント登録している人だけ（登録なしなら空） */
export async function fetchMyAnswers(): Promise<Result<MyAnswer[]>> {
  if (!isSupabaseConfigured) return { ok: false, message: NOT_READY };
  if (!(await currentUserId())) return { ok: true, data: [] };
  const { data, error } = await supabase.rpc("my_answers", { p_limit: 200 });
  if (error) return { ok: false, message: `読み込めませんでした。${NETWORK}` };
  type Row = {
    response_id: string;
    answered_at: string;
    answers: Answers;
    link_id: string;
    title: string;
    kind: LinkKind;
    image: string | null;
    questions: Question[];
    maker_name: string;
  };
  return {
    ok: true,
    data: ((data ?? []) as Row[]).map((r) => ({
      id: r.response_id,
      answeredAt: r.answered_at,
      answers: r.answers,
      link: { id: r.link_id, title: r.title, kind: r.kind, image: r.image, questions: r.questions ?? [], makerName: r.maker_name },
    })),
  };
}

// ============================================================
// 作る人
// ============================================================

/**
 * ログインしていなければ、登録なしの「匿名ログイン」で始める（同じブラウザなら、次からも同じ人として扱われる）。
 * あとでメールアドレスにつなげられるようにする予定
 */
async function ensureUser(): Promise<string | null> {
  // 画像を何枚も同時に置き始めたときに、利用者を何人も作らないよう、始めている途中ならそれを待つ
  starting ??= (async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) return data.session.user.id;
    const { data: signed, error } = await supabase.auth.signInAnonymously();
    if (error || !signed.user) return null;
    return signed.user.id;
  })().finally(() => {
    starting = null;
  });
  return starting;
}
let starting: Promise<string | null> | null = null;

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

/**
 * data URL（data:image/jpeg;base64,...）をファイルの形にする。
 * fetch(dataUrl) は使わない：公開した版では、ブラウザの守りの決まり（CSP の connect-src）で data: への通信が止められ、保存が終わらなくなったため
 */
function dataUrlToBlob(dataUrl: string) {
  const [head, body] = dataUrl.split(",", 2);
  const type = /^data:([^;]+)/.exec(head)?.[1] ?? "application/octet-stream";
  const bin = atob(body ?? "");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

export type LinkDraft = Omit<FeedbackLink, "id"> & { /** みんなの募集の一覧に載せるか */ isPublic: boolean };

/** これから作る募集の id。画像を選んだ時点で置き始めるため、作る前に決めておける */
export function newLinkId() {
  return newId();
}

/**
 * 画像を1枚、保存場所に置いて、その URL を返す（失敗したら null）。
 * 作る画面では、画像を選んだらすぐ置き始める。保存を押したときに待つ時間を短くするため
 */
export async function uploadImage(linkId: string, dataUrl: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const uid = await ensureUser();
  if (!uid) return null;
  const path = `${uid}/${linkId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  try {
    const { error } = await supabase.storage.from("link-images").upload(path, dataUrlToBlob(dataUrl), { contentType: "image/jpeg" });
    return error ? null : supabase.storage.from("link-images").getPublicUrl(path).data.publicUrl;
  } catch {
    // 通信が切れたなど。保存を押したときに置き直す
    return null;
  }
}

/** リンクを作る。画面の写真（data URL）は保存場所に置いて、その URL を残す。id は先に決めておいたものを使える */
export async function createLink(draft: LinkDraft, presetId?: string): Promise<Result<string>> {
  if (!isSupabaseConfigured) return { ok: false, message: NOT_READY };
  const uid = await ensureUser();
  if (!uid) return { ok: false, message: `始められませんでした。${NETWORK}` };
  const id = presetId ?? newId();
  const images = await uploadImages(uid, id, draft.images);
  if (!images) return { ok: false, message: `写真を保存できませんでした。${NETWORK}` };
  const { error } = await supabase.from("links").insert({
    id,
    kind: draft.kind,
    title: draft.title,
    tagline: draft.tagline,
    url: draft.urls[0] ?? null,
    urls: draft.urls,
    images,
    image_captions: captionsFor(images, draft.imageCaptions),
    questions: draft.questions,
    maker_name: draft.makerName,
    closes_at: draft.closesAt,
    is_public: draft.isPublic,
  });
  if (error?.message.includes("too_many_links")) return { ok: false, message: "1時間に作れる募集は20件までです。少し時間をおいてから、もう一度お試しください" };
  if (error) return { ok: false, message: `リンクを作れませんでした。${NETWORK}` };
  // 管理用の URL の合言葉（ほかの端末から意見を見るため）。失敗しても、この端末からは見られるので続ける
  await supabase.from("link_secrets").insert({ link_id: id, admin_token: newToken() });
  return { ok: true, data: id };
}

/**
 * 画像を保存場所に置いて、その URL を返す。すでに置いてある画像（https://…）はそのまま。
 * 端末の中の画像（data URL）だけを、重ならない名前で新しく置く。1枚でも失敗したら null
 */
async function uploadImages(uid: string, linkId: string, list: string[]): Promise<string[] | null> {
  // 何枚あっても、同時に置く（1枚ずつ待つと、枚数の分だけ遅くなる）
  const out = await Promise.all(list.map((src) => (src.startsWith("data:") ? uploadImage(linkId, src) : Promise.resolve(src))));
  return out.every((u): u is string => u !== null) ? out : null;
}

/** 画像のタイトルを、画像と同じ数にそろえ、前後の空白を取る */
function captionsFor(images: string[], captions: string[]) {
  return images.map((_, i) => (captions[i] ?? "").trim().slice(0, 40));
}

/** 保存場所の画像の URL から、保存場所の中の場所（uid/リンク/ファイル名）を取り出す */
function storagePath(url: string) {
  const marker = "/storage/v1/object/public/link-images/";
  const at = url.indexOf(marker);
  return at < 0 ? null : decodeURIComponent(url.slice(at + marker.length));
}

/**
 * 募集を直す（作った人だけ。データベースの権限でも、持ち主以外は書き換えられない）。
 * questions を渡さないときは、質問は変えない（意見が届いたあとは、答えと質問がずれないよう変えられない）
 */
export async function updateLink(
  id: string,
  draft: Omit<LinkDraft, "questions"> & { questions: Question[] | null },
  previousImages: string[],
): Promise<Result<null>> {
  if (!isSupabaseConfigured) return { ok: false, message: NOT_READY };
  const uid = await currentUserId();
  if (!uid) return { ok: false, message: "ログインし直してください" };
  const images = await uploadImages(uid, id, draft.images);
  if (!images) return { ok: false, message: `写真を保存できませんでした。${NETWORK}` };
  const { data, error } = await supabase
    .from("links")
    .update({
      kind: draft.kind,
      title: draft.title,
      tagline: draft.tagline,
      url: draft.urls[0] ?? null,
      urls: draft.urls,
      images,
      image_captions: captionsFor(images, draft.imageCaptions),
      ...(draft.questions ? { questions: draft.questions } : {}),
      maker_name: draft.makerName,
      closes_at: draft.closesAt,
      is_public: draft.isPublic,
    })
    .eq("id", id)
    .select("id");
  if (error || !data?.length) return { ok: false, message: `保存できませんでした。${NETWORK}` };
  // 外した画像は、保存場所からも消す（失敗しても募集の中身には関係ない）
  // 待たずに次の画面へ進む
  const removed = previousImages.filter((u) => !images.includes(u)).map(storagePath).filter((p): p is string => !!p);
  if (removed.length) void supabase.storage.from("link-images").remove(removed);
  return { ok: true, data: null };
}

/** マイページの一覧（新しい順）。まだ何も作っていない人は空 */
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
      isPublic: row.is_public ?? false,
      responseCount: Number(byLink.get(row.id)?.response_count ?? 0),
      lastResponseAt: byLink.get(row.id)?.last_response_at ?? null,
    })),
  };
}

/** マイページ1本と、届いた意見（新しい順）。自分のものでなければ null */
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
      isPublic: row.is_public ?? false,
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
      isPublic: null,
    },
  };
}

/** みんなの募集の一覧（新しい順。締め切ったものは入らない） */
export async function fetchPublicLinks(): Promise<Result<PublicLink[]>> {
  if (!isSupabaseConfigured) return { ok: false, message: NOT_READY };
  const { data, error } = await supabase.rpc("public_links", { p_limit: 100 });
  if (error || !data) return { ok: false, message: `読み込めませんでした。${NETWORK}` };
  type Row = {
    id: string;
    kind: LinkKind;
    title: string;
    image: string | null;
    maker_name: string;
    response_count: number;
    created_at: string;
    closes_at: string | null;
    owner_answered: number;
  };
  return {
    ok: true,
    data: (data as Row[]).map((r) => ({
      id: r.id,
      kind: r.kind,
      title: r.title,
      image: r.image,
      makerName: r.maker_name,
      responseCount: Number(r.response_count),
      createdAt: r.created_at,
      closesAt: r.closes_at,
      ownerAnswered: Number(r.owner_answered),
    })),
  };
}

/** みんなの募集の一覧に載せる・外す（作った人だけ） */
export async function setLinkPublic(id: string, isPublic: boolean): Promise<Result<null>> {
  const { error } = await supabase.from("links").update({ is_public: isPublic }).eq("id", id);
  return error ? { ok: false, message: `変えられませんでした。${NETWORK}` } : { ok: true, data: null };
}

/** 締め切りを変える（null で締め切りなし。いまの時刻にすると、すぐ締め切る） */
export async function setLinkDeadline(id: string, closesAt: string | null): Promise<Result<null>> {
  const { error } = await supabase.from("links").update({ closes_at: closesAt }).eq("id", id);
  return error ? { ok: false, message: `変えられませんでした。${NETWORK}` } : { ok: true, data: null };
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
