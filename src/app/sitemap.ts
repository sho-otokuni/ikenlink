import type { MetadataRoute } from "next";

import { fetchPublicLinks } from "@/lib/links";
import { SITE_URL } from "@/lib/site";

/** 検索エンジンに知らせる画面の一覧：みんなが見る画面と、公開中の募集 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/list`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/new`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/guide`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
  const r = await fetchPublicLinks();
  const links: MetadataRoute.Sitemap = r.ok
    ? r.data.map((l) => ({ url: `${SITE_URL}/l/${l.id}`, lastModified: new Date(l.createdAt), changeFrequency: "daily", priority: 0.5 }))
    : [];
  return [...pages, ...links];
}
