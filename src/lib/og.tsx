import { ImageResponse } from "next/og";

/**
 * X などに貼ったときに出る画像カード（1200×630）の共通の形。
 * 画像の中の日本語には、その文字だけを含んだフォントを Google Fonts から取り寄せて使う（ファイルを小さくするため）。
 */
export const OG_SIZE = { width: 1200, height: 630 };

const C = {
  bg: "#FAFAFA",
  ink: "#111111",
  muted: "#666666",
  coral: "#EE6F55",
  peach: "#FFB067",
  line: "#E5E5E5",
};

async function loadFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`)
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}

/** 画像の中の文字に必要なフォント（見出しは Zen Maru Gothic、ほかは Noto Sans JP） */
async function fonts(heading: string, body: string) {
  const [zen, noto] = await Promise.all([loadFont("Zen+Maru+Gothic", 700, heading), loadFont("Noto+Sans+JP", 700, body)]);
  return [
    ...(zen ? [{ name: "Zen", data: zen, weight: 700 as const, style: "normal" as const }] : []),
    ...(noto ? [{ name: "Noto", data: noto, weight: 700 as const, style: "normal" as const }] : []),
  ];
}

/** 長すぎる文字は、カードからはみ出さないよう縮める */
function clip(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** 右側に置くもの。画像があればその画像、なければ吹き出しの飾り */
function Frame({ children, footer, image }: { children: React.ReactNode; footer: string; image?: string | null }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: C.bg,
        padding: "64px 72px",
        fontFamily: "Noto",
        color: C.ink,
        borderBottom: `16px solid ${C.coral}`,
        position: "relative",
      }}
    >
      {image ? <Picture src={image} /> : <Bubbles />}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Mark />
        <div style={{ fontFamily: "Zen", fontSize: 34 }}>意見リンク</div>
      </div>
      {children}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", background: C.peach, color: C.ink, fontSize: 30, padding: "12px 28px", borderRadius: 999 }}>{footer}</div>
      </div>
    </div>
  );
}

/** 募集の1枚目の画像（右側に、角を丸めて切り抜いて置く） */
function Picture({ src }: { src: string }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 64,
        top: 56,
        width: 440,
        height: 486,
        display: "flex",
        borderRadius: 32,
        overflow: "hidden",
        border: `4px solid ${C.line}`,
        background: "#FFFFFF",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 画像カードを作る道具（next/og）の中では、ふつうの img を使う */}
      <img src={src} alt="" width={440} height={486} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
}

/**
 * 画像カードに載せる画像を読み込んで、カードの中に埋め込める形（data URL）にする。
 * 読めない・大きすぎる・画像でないときは null（そのときは画像なしのカードにする）
 */
async function loadPicture(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/^image\/(jpeg|png)$/.test(type)) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 2_500_000) return null;
    return `data:${type};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

/** ロゴのマーク（2つの吹き出しが絡み合う）。components/Logo.tsx と同じ形 */
function Mark() {
  return (
    <svg width="52" height="52" viewBox="0 0 64 64">
      <path d="M11 34l-3 10 10-8z" fill={C.coral} />
      <rect x="4" y="8" width="36" height="28" rx="9" fill="none" stroke={C.coral} strokeWidth="5" />
      <path d="M24 32v12" stroke={C.bg} strokeWidth="10" />
      <path d="M53 50l3 10-10-8z" fill={C.peach} />
      <rect x="24" y="24" width="36" height="28" rx="9" fill="none" stroke={C.peach} strokeWidth="5" />
      <path d="M40 19v9" stroke={C.bg} strokeWidth="10" />
      <path d="M40 18v11" stroke={C.coral} strokeWidth="5" />
    </svg>
  );
}

/** 右側の飾り：意見の吹き出しが3つ重なっている（文字の邪魔にならないよう、右の余白に置く） */
function Bubbles() {
  const bubble = (left: number, top: number, w: number, h: number, bg: string, tail: "left" | "right") => (
    <div style={{ position: "absolute", left, top, display: "flex" }}>
      <div style={{ width: w, height: h, borderRadius: 40, background: bg, display: "flex", alignItems: "center", padding: "0 32px", gap: 14 }}>
        <div style={{ width: w * 0.42, height: 14, borderRadius: 999, background: "rgba(0,0,0,0.18)" }} />
        <div style={{ width: w * 0.2, height: 14, borderRadius: 999, background: "rgba(0,0,0,0.12)" }} />
      </div>
      <div
        style={{
          // しっぽは、45度まわした小さな四角（画像の作り方の都合で、三角の線は使えない）
          position: "absolute",
          bottom: -12,
          [tail]: 48,
          width: 28,
          height: 28,
          background: bg,
          transform: "rotate(45deg)",
        }}
      />
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", display: "flex" }}>
      {bubble(860, 120, 260, 96, "#FDE6E0", "left")}
      {bubble(800, 262, 300, 96, C.peach, "right")}
      {bubble(880, 404, 230, 96, "#E6F4EA", "left")}
    </div>
  );
}

/** サイト全体のカード */
export async function siteCard() {
  const heading = "「どう思う？」を、気軽に聞ける。意見リンク";
  const body = "画像や URL を貼るだけで、意見が集まる。答える人は登録なし・30秒";
  return new ImageResponse(
    (
      <Frame footer="答える人は登録なし・30秒">
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "Zen", fontSize: 88, lineHeight: 1.25 }}>
            <div>「どう思う？」を、</div>
            <div>気軽に聞ける。</div>
          </div>
          <div style={{ fontSize: 32, color: C.muted, maxWidth: 680 }}>画像や URL を貼るだけで、意見が集まる</div>
        </div>
      </Frame>
    ),
    { ...OG_SIZE, fonts: await fonts(heading, body) },
  );
}

/** 募集ごとのカード（タイトルと、募集している人）。画像を貼った募集なら、1枚目の画像も右に載せる */
export async function linkCard(title: string, makerName: string, imageUrl?: string | null) {
  const image = await loadPicture(imageUrl);
  // 画像があるときは、文字を左の半分ほどに収める
  const width = image ? 560 : 700;
  const t = clip(title, image ? 24 : 28);
  const lead = `${clip(makerName, 12)}さんが、意見を募集しています`;
  const footer = "30秒・登録なしで答えられます";
  const size = image ? (t.length > 8 ? 60 : 80) : t.length > 10 ? 72 : 96;
  return new ImageResponse(
    (
      <Frame footer={footer} image={image}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: image ? 30 : 34, color: C.muted, maxWidth: width }}>{lead}</div>
          <div style={{ display: "flex", maxWidth: width, fontFamily: "Zen", fontSize: size, lineHeight: 1.2 }}>{t}</div>
        </div>
      </Frame>
    ),
    { ...OG_SIZE, fonts: await fonts(`意見リンク${t}`, `${lead}${footer}`) },
  );
}
