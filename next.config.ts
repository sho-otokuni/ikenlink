import type { NextConfig } from "next";

/** 画像を読むのは、この Supabase のプロジェクトの保存場所だけ（ほかのプロジェクトの画像を中継させない） */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : "localhost";

/**
 * ブラウザに伝える守りの決まり。
 * - ほかのサイトの中に埋め込ませない（クリックジャッキング対策）
 * - 外へ移るときに URL の続き（自分専用の URL の合言葉など）を渡さない
 * - 読み込めるもの（画像・通信先）を自分のサイトと Supabase に絞る（公開した版だけ。開発中は Next.js が eval を使うため）
 */
const csp = [
  "default-src 'self'",
  // Google の公式のログインボタン（accounts.google.com/gsi）を読み込めるようにする
  "script-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/client",
  "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
  "frame-src https://accounts.google.com/gsi/",
  `img-src 'self' data: blob: https://${supabaseHost} https://picsum.photos https://fastly.picsum.photos https://lh3.googleusercontent.com`,
  "font-src 'self'",
  `connect-src 'self' https://${supabaseHost} https://accounts.google.com/gsi/`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: csp }] : []),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    // 画面の写真は Supabase の保存場所から読む。仮のデータは picsum を使う
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/link-images/**" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
};

export default nextConfig;
