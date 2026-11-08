import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * 検索エンジンへの案内。自分専用の画面（マイページ・設定・ログインなど）は読みに来なくてよい。
 * 募集の画面（/l/…）は、公開中の募集だけを各画面で検索に載せる（非公開の募集は noindex）
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/me", "/settings", "/login", "/signup"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
