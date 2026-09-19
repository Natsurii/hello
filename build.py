#!/usr/bin/env python3
import json
import os

DOMAIN = "https://natsurii.pages.dev"
BLOGS_DIR = "blogs"

TEMPLATE = """<!--
 Copyright (c) 2025 Natsurii
 
 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->
<!DOCTYPE html>
<html lang="en">
<head>
  <script>
    (function () {{
      try {{
        var t = localStorage.getItem('natsurii-theme') === 'light' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', t);
      }} catch (e) {{
        document.documentElement.setAttribute('data-theme', 'dark');
      }}
    }})();
  </script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{description}">
  <title>Natsurii - {title}</title>
  
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link rel="preload" href="../assets/Px437_IBM_VGA_9x16.ttf" as="font" type="font/ttf">
  <link rel="icon" type="image/gif" href="../assets/favicon.gif">
  
  <!-- Open Graph / Social SEO -->
  <meta property="og:site_name" content="Natsurii">
  <meta property="og:type" content="article">
  <meta property="og:url" content="{DOMAIN}/blogs/{slug}.html">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta property="og:image" content="{DOMAIN}/assets/og/{slug}.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="{title}">
  <meta property="article:published_time" content="{date}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{title}">
  <meta name="twitter:description" content="{description}">
  <meta name="twitter:image" content="{DOMAIN}/assets/og/{slug}.png">

  <!-- Schema.org Structured Data (JSON-LD) -->
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "{title}",
    "description": "{description}",
    "datePublished": "{date}",
    "author": {{
      "@type": "Person",
      "name": "Natsurii"
    }}
  }}
  </script>

  <link rel="stylesheet" href="../style.css">
  <link id="prism-dark" rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-okaidia.min.css">
  <link id="prism-light" rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism.min.css" disabled>
  <script src="https://cdn.jsdelivr.net/npm/jquery/dist/jquery.min.js" defer></script>
  <script src="../script.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to Content</a>
  <nav class="sr-nav" aria-label="Main Navigation">
    <a href="../index.html">Home</a>
    <a href="../about.html">About</a>
    <a href="../blogs.html">Blogs</a>
  </nav>
  <header class="ascii-container" aria-hidden="true"></header>
  <main id="main" class="ascii-container markdown-container">
    <h1 class="sr-only">{title}</h1>
    <div class="blog-nav-top">
      <a href="../blogs.html">&lt;-- [back to blogs]</a>
      <hr class="retro-hr">
    </div>
    <div id="post-loading" aria-live="polite">Loading post content…</div>
    <div id="post-content" aria-live="polite"></div>
    <div class="blog-nav-bottom">
      <hr class="retro-hr">
      <a href="../blogs.html">&lt;-- [back to blogs]</a>
    </div>
  </main>
  <footer class="ascii-container" aria-hidden="true"></footer>

  <script>
  document.addEventListener('DOMContentLoaded', function () {{
    asciiToHTML('../components/header.utf8ans', 'header', 2, 5, function() {{
        addHyperlinkToText('header', '<home>', '../index.html');
        addHyperlinkToText('header', '<about>', '../about.html');
        addHyperlinkToText('header', '<blogs>', '../blogs.html');
    }});
    asciiToHTML('../components/footer.utf8ans', 'footer', 2, 5);

    $.get('../content/blogs/{slug}.md')
      .done(function(markdownText) {{
        $('#post-loading').hide();
        const htmlContent = parseMarkdown(markdownText);
        $('#post-content').html(htmlContent);
        Prism.highlightAll();
        fitAsciiLines();
        $('#post-content img').on('load', fitAsciiLines);
      }})
      .fail(function() {{
        $('#post-loading').text('Error: Blog post not found. Check the URL or return to the blog list.');
      }});
  }});
  </script>
</body>
</html>
"""

def main():
    manifest_path = "content/blogs/manifest.json"
    if not os.path.exists(manifest_path):
        print(f"Error: {manifest_path} not found.")
        return

    os.makedirs(BLOGS_DIR, exist_ok=True)

    with open(manifest_path, "r", encoding="utf-8") as f:
        posts = json.load(f)

    sitemap_urls = [
        f"  <url>\n    <loc>{DOMAIN}/index.html</loc>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>",
        f"  <url>\n    <loc>{DOMAIN}/blogs.html</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>",
        f"  <url>\n    <loc>{DOMAIN}/about.html</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>"
    ]

    for post in posts:
        slug = post["slug"]
        title = post["title"]
        description = post["description"]
        date = post.get("date", "2026-01-01")

        html_content = TEMPLATE.format(
            slug=slug,
            title=title,
            description=description,
            date=date,
            DOMAIN=DOMAIN,
        )

        output_file = os.path.join(BLOGS_DIR, f"{slug}.html")
        with open(output_file, "w", encoding="utf-8") as out:
            out.write(html_content)
        print(f"Generated: {output_file}")

        sitemap_urls.append(
            f"  <url>\n    <loc>{DOMAIN}/{BLOGS_DIR}/{slug}.html</loc>\n    <lastmod>{date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>"
        )

    sitemap_xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + \
                  "\n".join(sitemap_urls) + \
                  '\n</urlset>\n'

    with open("sitemap.xml", "w", encoding="utf-8") as sm:
        sm.write(sitemap_xml)
    print("Generated: sitemap.xml")

if __name__ == "__main__":
    main()
