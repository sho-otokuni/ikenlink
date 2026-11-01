/**
 * この端末で答えたリンク（一覧で「答えた」と出し、まだ答えていないものを選びやすくするため）。
 * ブラウザの中だけに置く、使いやすさのための覚え書き。消えても困らない
 */
const KEY = "iken-link:answered";

export function answeredIds(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function markAnswered(id: string) {
  try {
    const ids = answeredIds().filter((x) => x !== id);
    window.localStorage.setItem(KEY, JSON.stringify([id, ...ids].slice(0, 300)));
  } catch {
    // 保存できなくても、答えること自体には関係ない
  }
}
