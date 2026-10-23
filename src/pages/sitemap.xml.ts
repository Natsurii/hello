import type { APIRoute } from "astro";
import { getEmDashCollection } from "emdash";

const ORIGIN = "https://natsurii.pages.dev";

export const GET: APIRoute = async () => {
	const { entries: posts } = await getEmDashCollection("posts", { orderBy: { slug: "asc" } });

	const urls = [
		{ loc: `${ORIGIN}/`, changefreq: "monthly", priority: "1.0" },
		{ loc: `${ORIGIN}/posts`, changefreq: "weekly", priority: "0.8" },
		{ loc: `${ORIGIN}/about`, changefreq: "monthly", priority: "0.8" },
		...posts.map((p) => ({
			loc: `${ORIGIN}/posts/${p.id}`,
			lastmod: p.data.publishedAt?.toISOString().slice(0, 10),
			changefreq: "monthly",
			priority: "0.7",
		})),
	];

	const body = urls
		.map(
			(u) =>
				`  <url>\n    <loc>${u.loc}</loc>\n${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ""}    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
		)
		.join("\n");

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
		{ headers: { "Content-Type": "application/xml; charset=utf-8" } },
	);
};
