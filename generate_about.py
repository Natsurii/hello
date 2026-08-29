#!/usr/bin/env python3
import html
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "resume.yml"
OUTPUT_FILE = BASE_DIR / "about.html"


def esc(text):
    return html.escape(str(text), quote=False)


def emphasize(text):
    return re.sub(r"\*([^*]+)\*", r"<em>\1</em>", esc(text))


def fmt_date(value):
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if hasattr(value, "isoformat"):
        return value.isoformat()[:7]
    return str(value)


def render_date(start, end):
    start = fmt_date(start)
    end = fmt_date(end)
    if start and end:
        return f"{start} - {end}"
    return start or end or ""


def render_highlights(items):
    items = [i for i in (items or []) if str(i).strip()]
    if not items:
        return ""
    lis = "\n".join(f"              <li>{emphasize(i)}</li>" for i in items)
    return "<ul>\n" + lis + "\n            </ul>"


def render_section(title, body):
    return (
        f'          <h2>{esc(title)}</h2>\n'
        f"{body}\n"
        f'          <hr class="retro-hr">\n'
    )


def build_about_html(data):
    parts = []
    personal = data.get("personal", {})
    name = personal.get("name", "")
    titles = personal.get("titles", []) or []
    location = personal.get("location", {}) or {}
    loc_text = ", ".join(
        str(location.get(k) or "").strip() for k in ("city", "country")
    )
    loc_text = loc_text.strip(", ")

    banner = "C:\\ABOUT\\INDEX.LOG"
    parts.append(f'      <div class="blog-header-banner">{banner}</div>')

    if name:
        parts.append(f"      <h1>{esc(name)}</h1>")
    if titles:
        parts.append(f"      <p>{esc(' | '.join(titles))}</p>")
    if loc_text:
        parts.append(f"      <p>{esc(loc_text)}</p>")

    objectives = data.get("objectives", []) or []
    if objectives:
        body = "".join(f"      <p>{emphasize(o)}</p>\n" for o in objectives)
        parts.append(render_section("Objective", body))

    work = data.get("work", []) or []
    work_blocks = []
    for job in work:
        org = job.get("organization", "")
        url = job.get("url")
        jloc = job.get("location", "")
        positions = job.get("positions", []) or []
        org_text = f'<a href="{esc(url)}">{esc(org)}</a>' if url else esc(org)
        header = org_text
        if jloc:
            header += f" &mdash; {esc(jloc)}"
        current = [f"      <h2>{header}</h2>"]
        for pos in positions:
            ptitle = pos.get("position", "")
            dates = render_date(pos.get("startDate"), pos.get("endDate"))
            info = " &mdash; ".join(x for x in (esc(ptitle), dates) if x)
            if info:
                current.append(f"      <p><strong>{info}</strong></p>")
            current.append(render_highlights(pos.get("highlights")))
        work_blocks.append("\n".join(current))
    if work_blocks:
        parts.append(render_section("Work", "\n".join(work_blocks)))

    projects = data.get("projects", []) or []
    if projects:
        groups = []
        for proj in projects:
            name_txt = proj.get("name", "")
            url = proj.get("url")
            title = f'<a href="{esc(url)}">{esc(name_txt)}</a>' if url else esc(name_txt)
            dates = render_date(proj.get("startDate"), proj.get("endDate"))
            if dates:
                title += f" ({esc(dates)})"
            body = f"      <h3>{title}</h3>\n"
            body += render_highlights(proj.get("highlights"))
            groups.append(body)
        parts.append(render_section("Projects", "\n".join(groups)))

    skills = data.get("skills", []) or []
    skill_blocks = []
    for cat in skills:
        category = cat.get("category", "")
        items = [s for s in (cat.get("skills", []) or []) if str(s).strip()]
        if not items:
            continue
        joined = esc(" | ".join(items))
        skill_blocks.append(f"      <h3>{esc(category)}</h3>\n      <p>{joined}</p>")
    if skill_blocks:
        parts.append(render_section("Skills", "\n".join(skill_blocks)))

    education = data.get("education", []) or []
    if education:
        ed_blocks = []
        for inst in education:
            inst_name = inst.get("institution", "")
            url = inst.get("url")
            title = f'<a href="{esc(url)}">{esc(inst_name)}</a>' if url else esc(inst_name)
            details = []
            if inst.get("studyType"):
                details.append(esc(inst["studyType"]))
            if inst.get("area"):
                details.append(esc(inst["area"]))
            dates = render_date(inst.get("startDate"), inst.get("endDate"))
            if dates:
                details.append(esc(dates))
            if inst.get("location"):
                details.append(esc(inst["location"]))
            if details:
                title += f" &mdash; {', '.join(details)}"
            body = f"      <h3>{title}</h3>\n"
            honors = inst.get("honors", []) or []
            if honors:
                body += "      <p>" + esc(", ".join(honors)) + "</p>\n"
            courses = inst.get("courses", []) or []
            if courses:
                body += "      <p>" + esc(", ".join(courses)) + "</p>\n"
            body += render_highlights(inst.get("highlights"))
            ed_blocks.append(body)
        parts.append(render_section("Education", "\n".join(ed_blocks)))

    affiliations = data.get("affiliations", []) or []
    if affiliations:
        aff_blocks = []
        for aff in affiliations:
            org = aff.get("organization", "")
            url = aff.get("url")
            title = f'<a href="{esc(url)}">{esc(org)}</a>' if url else esc(org)
            details = []
            if aff.get("position"):
                details.append(esc(aff["position"]))
            if aff.get("location"):
                details.append(esc(aff["location"]))
            dates = render_date(aff.get("startDate"), aff.get("endDate"))
            if dates:
                details.append(esc(dates))
            if details:
                title += f" &mdash; {', '.join(details)}"
            body = f"      <h3>{title}</h3>\n"
            body += render_highlights(aff.get("highlights"))
            aff_blocks.append(body)
        parts.append(render_section("Affiliations", "\n".join(aff_blocks)))

    awards = data.get("awards", []) or []
    if awards:
        blocks = []
        for aw in awards:
            title = aw.get("title", "")
            details = []
            if aw.get("date"):
                details.append(esc(fmt_date(aw["date"])))
            if aw.get("issuer"):
                details.append(esc(aw["issuer"]))
            if details:
                title += f" &mdash; {', '.join(details)}"
            body = f"      <h3>{esc(title)}</h3>\n"
            body += render_highlights(aw.get("highlights"))
            blocks.append(body)
        parts.append(render_section("Awards", "\n".join(blocks)))

    certificates = data.get("certificates", []) or []
    if certificates:
        lis = []
        for cert in certificates:
            title = cert.get("name", "")
            url = cert.get("url")
            name_txt = f'<a href="{esc(url)}">{esc(title)}</a>' if url else esc(title)
            details = []
            if cert.get("issuer"):
                details.append(esc(cert["issuer"]))
            if cert.get("date"):
                details.append(esc(fmt_date(cert["date"])))
            if details:
                name_txt += f" &mdash; {', '.join(details)}"
            lis.append(f"          <li>{name_txt}</li>")
        body = "<ul>\n" + "\n".join(lis) + "\n        </ul>"
        parts.append(render_section("Certificates", body))

    publications = data.get("publications", []) or []
    if publications:
        lis = []
        for pub in publications:
            name_txt = pub.get("name", "")
            url = pub.get("url")
            txt = f'<a href="{esc(url)}">{esc(name_txt)}</a>' if url else esc(name_txt)
            details = [d for d in (pub.get("publisher"), pub.get("releaseDate")) if d]
            if details:
                txt += f" &mdash; {esc(' | '.join(map(str, details)))}"
            lis.append(f"          <li>{txt}</li>")
        body = "<ul>\n" + "\n".join(lis) + "\n        </ul>"
        parts.append(render_section("Publications", body))

    languages = data.get("languages", []) or []
    if languages:
        lis = []
        for lang in languages:
            entry = lang.get("language", "")
            if lang.get("fluency"):
                entry = f"{entry} ({lang['fluency']})"
            lis.append(f"          <li>{esc(entry)}</li>")
        body = "<ul>\n" + "\n".join(lis) + "\n        </ul>"
        parts.append(render_section("Languages", body))

    main_content = "\n".join(parts)

    return f"""<!--
 Copyright (c) 2025 Natsurii
 
 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta
    name="description"
    content="Natsurii's Portfolio. About">
  <title>Natsurii - About</title>
  <link rel="icon" type="image/gif" href="assets/favicon.gif">
  <link rel="stylesheet" href="style.css">
  <script src="https://cdn.jsdelivr.net/npm/jquery/dist/jquery.min.js"></script>
  <script src="script.js" defer></script>
</head>
<body>
  <header class="ascii-container"></header>
  <main class="ascii-container blog-list-container markdown-container">
    <div id="post-content">
{main_content}
    </div>
  </main>
  <footer class="ascii-container"></footer>

  <script>
  $(document).ready(function () {{
    asciiToHTML('./components/header.utf8ans', 'header', 2, 5, function() {{
        addHyperlinkToText('header', '<home>', 'index.html');
        addHyperlinkToText('header', '<about>', 'about.html');
        addHyperlinkToText('header', '<blogs>', 'blogs.html');
    }});
    asciiToHTML('./components/footer.utf8ans', 'footer', 2, 5);
  }});
  </script>
</body>
</html>
"""


def main():
    if not DATA_FILE.exists():
        raise SystemExit(f"Data file not found: {DATA_FILE}")
    try:
        import yaml
    except ImportError:
        raise SystemExit("PyYAML is required. Install with: pip install pyyaml")

    with DATA_FILE.open() as f:
        data = yaml.safe_load(f) or {}

    OUTPUT_FILE.write_text(build_about_html(data))
    print(f"Wrote {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
