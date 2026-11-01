import { ImageResponse } from "next/og";

/**
 * X などに貼ったときに出る画像カード（1200×630）の共通の形。
 * 画像の中の日本語には、その文字だけを含んだフォントを Google Fonts から取り寄せて使う（ファイルを小さくするため）。
 */
export const OG_SIZE = { width: 1200, height: 630 };

const C = {
  bg: "#FFF9F5",
  ink: "#1C1838",
  muted: "#5E5C66",
  coral: "#EE6F55",
  peach: "#FFB067",
  line: "#E6E3DD",
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

function Frame({ children, footer }: { children: React.ReactNode; footer: string }) {
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
      <Bubbles />
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 28, height: 28, borderRadius: 999, background: C.coral }} />
        <div style={{ fontFamily: "Zen", fontSize: 34 }}>意見リンク</div>
      </div>
      {children}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", background: C.peach, color: C.ink, fontSize: 30, padding: "12px 28px", borderRadius: 999 }}>{footer}</div>
      </div>
    </div>
  );
}

/** 右側の飾り：意見の吹き出しが3つ重なっている（文字の邪魔にならないよう、右の余白に置く） */
function Bubbles() {
  const bubble = (left: number, top: number, w: number, h: number, bg: string, tail: "left" | "right") => (
    <div style={{ position: "absolute", left, top, display: "flex" }}>
      <div style={{ width: w, height: h, borderRadius: 40, background: bg, display: "flex", alignItems: "center", padding: "0 32px", gap: 14 }}>
        <div style={{ width: w * 0.42, height: 14, borderRadius: 999, background: "rgba(28,24,56,0.18)" }} />
        <div style={{ width: w * 0.2, height: 14, borderRadius: 999, background: "rgba(28,24,56,0.12)" }} />
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
  const heading = "作ったものに、人の意見を。意見リンク";
  const body = "URL を貼るだけで、本物の人の意見が集まる。答える人は登録なし・30秒";
  return new ImageResponse(
    (
      <Frame footer="答える人は登録なし・30秒">
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "Zen", fontSize: 88, lineHeight: 1.25 }}>
            <div>作ったものに、</div>
            <div>人の意見を。</div>
          </div>
          <div style={{ fontSize: 32, color: C.muted, maxWidth: 680 }}>URL を貼るだけで、本物の人の意見が集まる</div>
        </div>
      </Frame>
    ),
    { ...OG_SIZE, fonts: await fonts(heading, body) },
  );
}

/**
 * リンクごとのカード。5秒テストを公平にするため、画面の写真と説明は載せない（名前と募集している人だけ）
 */
export async function linkCard(title: string, makerName: string) {
  const t = clip(title, 28);
  const lead = `${clip(makerName, 12)}さんが、意見を募集しています`;
  const footer = "30秒・登録なしで答えられます";
  return new ImageResponse(
    (
      <Frame footer={footer}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 34, color: C.muted, maxWidth: 700 }}>{lead}</div>
          <div style={{ display: "flex", maxWidth: 700, fontFamily: "Zen", fontSize: t.length > 10 ? 72 : 96, lineHeight: 1.2 }}>{t}</div>
        </div>
      </Frame>
    ),
    { ...OG_SIZE, fonts: await fonts(`意見リンク${t}`, `${lead}${footer}`) },
  );
}
