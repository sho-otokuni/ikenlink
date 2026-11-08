/**
 * 新しい意見の知らせ。募集ごとに「最後に見たときの意見の数」をこのブラウザに覚えておき、
 * いまの数との差を「新着」として出す。
 * 初めて使うとき（まだ何も覚えていないとき）は、いまの数をすべて見たことにする（昔の意見を新着と言わない）
 */

const KEY = "iken-link:seen";
const EVENT = "iken-link:seen-changed";

type Seen = Record<string, number>;

function read(): Seen | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Seen) : null;
  } catch {
    return null;
  }
}

function write(seen: Seen) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(seen));
    // 同じページの中のほかの部品（ヘッダーの印など）にも知らせる
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // 覚えておけなくても、知らせが出ないだけ
  }
}

/** 募集ごとの新着の数。counts は { 募集の id: いまの意見の数 } */
export function newCounts(counts: Record<string, number>): Record<string, number> {
  let seen = read();
  if (!seen) {
    // 初めて：いまの数を見たことにする
    seen = { ...counts };
    write(seen);
  }
  const out: Record<string, number> = {};
  for (const [id, n] of Object.entries(counts)) {
    // 覚えていない募集（このあと作ったもの）は、0件から数える
    const diff = n - (seen[id] ?? 0);
    if (diff > 0) out[id] = diff;
  }
  return out;
}

/** 届いた意見の画面を開いたとき：いまの数を見たことにする */
export function markSeen(id: string, count: number) {
  const seen = read() ?? {};
  if (seen[id] === count) return;
  write({ ...seen, [id]: count });
}

/** 見たことが変わったときに呼ぶ（ヘッダーの印を消すため） */
export function onSeenChange(fn: () => void) {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}
