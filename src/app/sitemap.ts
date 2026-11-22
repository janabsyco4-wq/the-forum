import type { MetadataRoute } from "next";
import { SITE_URL, locales } from "@/i18n/config";
import { getData } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getData();
  const [articles, debates, discussions, users] = await Promise.all([
    data.listArticles({ pageSize: 1000 }),
    data.listDebates(),
    data.listDiscussions({ pageSize: 1000 }),
    data.listUsers({ pageSize: 1000 }),
  ]);
  const paths = [
    "",
    "/articles",
    "/debates",
    "/discussions",
    "/research",
    ...articles.items.map((a) => `/articles/${a.slug}`),
    ...debates.filter((d) => d.status !== "upcoming").map((d) => `/debates/${d.slug}`),
    ...discussions.items.map((d) => `/discussions/${d.slug}`),
    ...users.items.filter((u) => u.status === "active").map((u) => `/u/${u.username}`),
  ];
  return paths.flatMap((p) =>
    locales.map((l) => ({
      url: `${SITE_URL}/${l}${p}`,
      alternates: { languages: Object.fromEntries(locales.map((x) => [x, `${SITE_URL}/${x}${p}`])) },
    })),
  );
}
