import type { APIRoute } from "astro";

const ORIGIN = "https://natsurii.pages.dev";

export const GET: APIRoute = async () =>
	new Response(
		`User-agent: *\nAllow: /\n\n# Disallow admin and API routes\nDisallow: /_emdash/\n\nSitemap: ${ORIGIN}/sitemap.xml\n`,
		{ headers: { "Content-Type": "text/plain; charset=utf-8" } },
	);
