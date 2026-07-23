#!/usr/bin/env python3
"""works.json から作品グリッドとJSON-LDをHTMLに事前描画する（クローラー対策）。
works.json を変更したら必ず実行: python3 tools/build_static.py
JS(site.js)は事前描画済みのカードを検出するとクリックのみ紐付ける。"""
import json, re, html

BASE = 'https://takamura-terumi.github.io/'
d = json.load(open('works.json', encoding='utf-8'))
works = d['works']

def card(w, i):
    spec = '　'.join(x for x in [w.get('size'), w.get('materials')] if x)
    spec_html = f'<div class="spec">{html.escape(spec)}</div>' if spec else ''
    return (f'<div class="card reveal" style="transition-delay:{i%3*0.08}s">'
            f'<div class="frame"><img src="{w["file"]}" alt="{html.escape(w["title"])}" '
            f'width="{w["width"]}" height="{w["height"]}" loading="lazy"></div>'
            f'<div class="info"><h3>{html.escape(w["title"])}</h3>'
            f'<div class="year">{html.escape(w["year"])}制作</div>{spec_html}</div></div>')

def replace_between(s, start, end, content):
    return re.sub(re.escape(start) + r'.*?' + re.escape(end),
                  start + '\n' + content + '\n' + end, s, flags=re.S)

def artwork_ld(w):
    return {"@type": "VisualArtwork", "name": w["title"],
            "image": BASE + w["file"], "dateCreated": w["year"],
            "creator": {"@type": "Person", "name": "高村 輝美"}}

# ---- index.html ----
featured = [w for w in works if w.get('featured')]
s = open('index.html', encoding='utf-8').read()
s = replace_between(s, '<!--WORKS:START-->', '<!--WORKS:END-->',
                    '\n'.join(card(w, i) for i, w in enumerate(featured)))
ld = {"@context": "https://schema.org", "@type": "Person",
      "name": "高村 輝美", "alternateName": "Terumi Takamura",
      "jobTitle": "日本画家", "url": BASE, "image": BASE + "assets/portrait.jpg",
      "description": "日本画家。水干絵具・岩絵具・金泥による心象画。"}
s = replace_between(s, '<!--JSONLD:START-->', '<!--JSONLD:END-->',
                    '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + '</script>')
# ALL WORKSボタンの点数も静的に正しく焼き込む（JS無効環境・クローラー向け）
s = re.sub(r'(id="all-count">)\d+', r'\g<1>' + str(len(works)), s)
open('index.html', 'w', encoding='utf-8').write(s)

# ---- works.html ----
year_of = lambda w: int(re.match(r'(\d{4})', w['year']).group(1))
nihonga = [w for w in works if year_of(w) >= 2021]
early = [w for w in works if year_of(w) < 2021]
s = open('works.html', encoding='utf-8').read()
s = replace_between(s, '<!--NIHONGA:START-->', '<!--NIHONGA:END-->',
                    '\n'.join(card(w, i) for i, w in enumerate(nihonga)))
s = replace_between(s, '<!--EARLY:START-->', '<!--EARLY:END-->',
                    '\n'.join(card(w, i) for i, w in enumerate(early)))
ld2 = {"@context": "https://schema.org", "@type": "ItemList",
       "name": "高村輝美 全作品",
       "itemListElement": [{"@type": "ListItem", "position": i + 1, "item": artwork_ld(w)}
                           for i, w in enumerate(works)]}
s = replace_between(s, '<!--JSONLD:START-->', '<!--JSONLD:END-->',
                    '<script type="application/ld+json">' + json.dumps(ld2, ensure_ascii=False) + '</script>')
open('works.html', 'w', encoding='utf-8').write(s)
print(f'事前描画完了: index={len(featured)}点 / works={len(nihonga)}+{len(early)}点 + JSON-LD')
