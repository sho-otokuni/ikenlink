import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";

// 本文は Noto Sans JP、見出しは Zen Maru Gothic
const noto = Noto_Sans_JP({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const zen = Zen_Maru_Gothic({
  variable: "--font-zen",
  subsets: ["latin"],
  weight: ["500", "700"],
});

/** 画像カードなどの URL の土台。独自ドメインにしたら NEXT_PUBLIC_SITE_URL に入れる */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "意見リンク",
  description: "作ったものの URL を貼るだけで、意見が集まるリンクができる。答える人は登録なし、30秒。",
  openGraph: { siteName: "意見リンク", locale: "ja_JP", type: "website" },
  // X では、大きな画像付きのカードで出す
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${noto.variable} ${zen.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
