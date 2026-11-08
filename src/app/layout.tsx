import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";

import { Footer } from "@/components/Footer";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

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

/**
 * 検索エンジン・SNS 向けの情報。各画面の title は「〇〇｜意見リンク」の形になる（template）。
 * canonical は各画面で、その画面の住所を入れる
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME}｜「これ、どう思う？」を気軽に聞ける意見募集サービス`, template: `%s｜${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: { siteName: SITE_NAME, locale: "ja_JP", type: "website", title: SITE_NAME, description: SITE_DESCRIPTION, url: "/" },
  // X では、大きな画像付きのカードで出す
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESCRIPTION },
  formatDetection: { telephone: false },
  // Google Search Console の所有確認（公開してよい値）
  verification: { google: "kD3wLmByYgorB0RLJQC1fcANBa2qaBxrccWb0L4_780" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${noto.variable} ${zen.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Footer />
      </body>
    </html>
  );
}
