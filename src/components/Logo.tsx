/**
 * ロゴのマーク：2つの吹き出しが、鎖の輪のように絡み合う（「意見」と「リンク」）。
 * 交わるところの切れ目は背景の色で描くので、置く場所の背景が --bg であること
 */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <path d="M11 34l-3 10 10-8z" fill="var(--coral)" />
      <rect x="4" y="8" width="36" height="28" rx="9" fill="none" stroke="var(--coral)" strokeWidth="5" />
      <path d="M24 32v12" stroke="var(--bg)" strokeWidth="10" />
      <path d="M53 50l3 10-10-8z" fill="var(--peach)" />
      <rect x="24" y="24" width="36" height="28" rx="9" fill="none" stroke="var(--peach)" strokeWidth="5" />
      <path d="M40 19v9" stroke="var(--bg)" strokeWidth="10" />
      <path d="M40 18v11" stroke="var(--coral)" strokeWidth="5" />
    </svg>
  );
}
