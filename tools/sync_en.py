#!/usr/bin/env python3
"""Regenerate en/index.html and en/cv.html from the root (Czech) pages.

The root pages are the single source of truth: they carry both language
variants in the DOM (lang="cs"/"en" tagged elements) plus data-en
attributes on <title> and the description <meta>. This script mirrors
them into the /en/ tree, where <html lang="en"> makes the CSS show the
English variant. Run after every copy change:

    python3 tools/sync_en.py
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = "https://adamantinestudios.github.io/personal_web/"

PAGES = {
    "index.html": {"canonical": BASE + "en/", "cs_href": "../", "en_href": "./"},
    "cv.html": {"canonical": BASE + "en/cv.html", "cs_href": "../cv.html", "en_href": "cv.html"},
}


def attr(html, tag_re, name):
    m = re.search(tag_re, html)
    if not m:
        sys.exit(f"pattern not found: {tag_re}")
    a = re.search(name + r'="([^"]*)"', m.group(0))
    if not a:
        sys.exit(f"attribute {name} not found in: {m.group(0)[:80]}")
    return a.group(1)


def transform(html, cfg):
    en_title = attr(html, r"<title[^>]*>", "data-en")
    en_desc = attr(html, r'<meta name="description"[^>]*>', "data-en")
    cs_canonical = attr(html, r'<link rel="canonical"[^>]*>', "href")

    html = html.replace('<html lang="cs">', '<html lang="en">', 1)
    html = re.sub(r"<title[^>]*>[^<]*</title>",
                  lambda m: re.sub(r">[^<]*</title>", f">{en_title}</title>", m.group(0)), html, count=1)
    html = re.sub(r'(<meta name="description"[^>]*content=")[^"]*(")',
                  lambda m: m.group(1) + en_desc + m.group(2), html, count=1)
    html = html.replace(f'<link rel="canonical" href="{cs_canonical}">',
                        f'<link rel="canonical" href="{cfg["canonical"]}">')
    html = re.sub(r'(<meta property="og:title" content=")[^"]*(")',
                  lambda m: m.group(1) + en_title + m.group(2), html, count=1)
    html = re.sub(r'(<meta property="og:description" content=")[^"]*(")',
                  lambda m: m.group(1) + en_desc + m.group(2), html, count=1)
    html = re.sub(r'(<meta property="og:image:alt" content=")[^"]*(")',
                  lambda m: m.group(1) + en_title + m.group(2), html, count=1)
    html = html.replace(f'<meta property="og:url" content="{cs_canonical}">',
                        f'<meta property="og:url" content="{cfg["canonical"]}">')
    html = html.replace('<meta property="og:locale" content="cs_CZ">',
                        '<meta property="og:locale" content="en_US">')
    html = html.replace('<meta property="og:locale:alternate" content="en_US">',
                        '<meta property="og:locale:alternate" content="cs_CZ">')
    html = html.replace('"inLanguage": "cs"', '"inLanguage": "en"')

    # assets live one level up from /en/
    html = html.replace('href="assets/', 'href="../assets/')
    html = html.replace('src="assets/', 'src="../assets/')
    html = html.replace('href="favicon.svg"', 'href="../favicon.svg"')

    # localized image alt texts
    html = re.sub(r'alt="[^"]*" data-alt-en="([^"]*)"',
                  lambda m: f'alt="{m.group(1)}" data-alt-en="{m.group(1)}"', html)

    # the ?lang=en redirect belongs to the Czech tree only
    html = re.sub(r'  <script>\n    /\* back-compat[^<]*</script>\n', "", html)

    # language switch: CS links back to the Czech tree, EN becomes current
    html = re.sub(r'<a data-lang-link="cs" href="[^"]*" aria-current="true">CS</a>',
                  f'<a data-lang-link="cs" href="{cfg["cs_href"]}">CS</a>', html)
    html = re.sub(r'<a data-lang-link="en" href="[^"]*">EN</a>',
                  f'<a data-lang-link="en" href="{cfg["en_href"]}" aria-current="true">EN</a>', html)
    return html


def main():
    out_dir = ROOT / "en"
    out_dir.mkdir(exist_ok=True)
    for name, cfg in PAGES.items():
        src = (ROOT / name).read_text(encoding="utf-8")
        (out_dir / name).write_text(transform(src, cfg), encoding="utf-8")
        print(f"en/{name} written")


if __name__ == "__main__":
    main()
