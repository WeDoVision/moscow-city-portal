#!/usr/bin/env python3
"""
Конвертация OSM-выгрузки (Overpass, building + building:part с geom)
в компактный JSON для 3D-карты портала.

Вход:  /tmp/osm_city_full.json (см. docs/API.md → раздел 3D-карта)
Выход: public/data/moscow-city.json
  { "buildings": [ { "p": [[x,z],...], "h": м, "mh": м, "t": towerId|None, "n": имя } ] }

Координаты — метры относительно центра Сити, y-up (three.js: x→восток, z→юг).
"""

import json
import math
import re
import sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "/tmp/osm_city_full.json"
DST = sys.argv[2] if len(sys.argv) > 2 else "public/data/moscow-city.json"

LAT0, LON0 = 55.7487, 37.5390  # центр делового центра
M_PER_LAT = 111320.0
M_PER_LON = 111320.0 * math.cos(math.radians(LAT0))

# towerId = complex_id whitewill; регэкспы по именам OSM
TOWER_PATTERNS = [
    (1, r"capital towers|капитал тауэрс"),
    (104, r"neva towers|нева тауэрс"),
    (107, r"\bоко\b|oko"),
    (115, r"федерац|federation|башня «восток»|башня «запад»"),
    (558, r"город столиц|city of capitals"),
    (503, r"импери|empire"),
    (69, r"дом\s*дау|dom dau"),
]

# безымянные в OSM башни добираем по координатам (lat, lon, радиус м)
TOWER_ANCHORS = [
    (1, 55.7551, 37.5299, 140),  # Capital Towers — три башни у воды
]


def parse_h(tags, key, levels_key, default=0.0):
    v = tags.get(key)
    if v:
        m = re.match(r"^\s*([\d.]+)", str(v).replace(",", "."))
        if m:
            return float(m.group(1))
    lv = tags.get(levels_key)
    if lv:
        try:
            return float(lv) * 3.3
        except ValueError:
            pass
    return default


def proj(lat, lon):
    return ((lon - LON0) * M_PER_LON, (LAT0 - lat) * M_PER_LAT)


def way_polygon(geom):
    pts = [proj(g["lat"], g["lon"]) for g in geom]
    if len(pts) > 1 and pts[0] == pts[-1]:
        pts = pts[:-1]
    return [[round(x, 1), round(z, 1)] for x, z in pts]


def relation_outers(el):
    """Склейка outer-сегментов мультиполигона в кольца."""
    segs = [
        [(g["lat"], g["lon"]) for g in m["geometry"]]
        for m in el.get("members", [])
        if m.get("role") in ("outer", "") and m.get("geometry")
    ]
    rings = []
    while segs:
        ring = segs.pop(0)
        changed = True
        while changed and ring[0] != ring[-1]:
            changed = False
            for i, s in enumerate(segs):
                if s[0] == ring[-1]:
                    ring += s[1:]
                elif s[-1] == ring[-1]:
                    ring += list(reversed(s))[1:]
                elif s[-1] == ring[0]:
                    ring = s[:-1] + ring
                elif s[0] == ring[0]:
                    ring = list(reversed(s))[:-1] + ring
                else:
                    continue
                segs.pop(i)
                changed = True
                break
        rings.append(ring)
    out = []
    for ring in rings:
        pts = [proj(la, lo) for la, lo in ring]
        if len(pts) > 1 and pts[0] == pts[-1]:
            pts = pts[:-1]
        if len(pts) >= 3:
            out.append([[round(x, 1), round(z, 1)] for x, z in pts])
    return out


def centroid(poly):
    xs = [p[0] for p in poly]
    zs = [p[1] for p in poly]
    return sum(xs) / len(xs), sum(zs) / len(zs)


def point_in_poly(pt, poly):
    x, z = pt
    inside = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, zi = poly[i]
        xj, zj = poly[j]
        if (zi > z) != (zj > z) and x < (xj - xi) * (z - zi) / (zj - zi) + xi:
            inside = not inside
        j = i
    return inside


def tower_id(name):
    if not name:
        return None
    low = name.lower()
    for tid, pat in TOWER_PATTERNS:
        if re.search(pat, low):
            return tid
    return None


def main():
    data = json.load(open(SRC))
    els = data["elements"]

    parts, buildings = [], []
    for el in els:
        tags = el.get("tags", {})
        is_part = "building:part" in tags and tags.get("building:part") != "no"
        is_building = "building" in tags
        if not (is_part or is_building):
            continue
        h = parse_h(tags, "height", "building:levels", 10.0)
        mh = parse_h(tags, "min_height", "building:min_level", 0.0)
        if h <= mh:
            continue
        polys = []
        if el["type"] == "way" and el.get("geometry"):
            p = way_polygon(el["geometry"])
            if len(p) >= 3:
                polys = [p]
        elif el["type"] == "relation":
            polys = relation_outers(el)
        for poly in polys:
            rec = {
                "p": poly,
                "h": round(h, 1),
                "mh": round(mh, 1),
                "n": tags.get("name"),
                "t": tower_id(tags.get("name")),
            }
            (parts if is_part else buildings).append(rec)

    # здание с детализацией частями не рендерим целиком
    part_centroids = [centroid(p["p"]) for p in parts]
    flat = list(parts)
    for b in buildings:
        covered = any(point_in_poly(c, b["p"]) for c in part_centroids)
        if not covered:
            flat.append(b)

    # части без имени наследуют башню от родительского здания
    named = [b for b in buildings if b["t"]]
    anchors_xy = [
        (tid, proj(lat, lon), r) for tid, lat, lon, r in TOWER_ANCHORS
    ]
    for rec in flat:
        if rec["t"] is None:
            c = centroid(rec["p"])
            for b in named:
                if point_in_poly(c, b["p"]):
                    rec["t"] = b["t"]
                    break
        if rec["t"] is None:
            for tid, (ax, az), r in anchors_xy:
                if math.hypot(c[0] - ax, c[1] - az) <= r:
                    rec["t"] = tid
                    break

    out = {"buildings": flat}
    json.dump(out, open(DST, "w"), ensure_ascii=False, separators=(",", ":"))
    tall = sorted([r for r in flat if r["h"] > 150], key=lambda r: -r["h"])
    print(f"total: {len(flat)} (parts {len(parts)}), >150m: {len(tall)}")
    for r in tall[:20]:
        print(f"  h={r['h']:.0f} t={r['t']} n={r['n']}")
    by_tower = {}
    for r in flat:
        if r["t"]:
            by_tower.setdefault(r["t"], 0)
            by_tower[r["t"]] += 1
    print("by tower:", by_tower)


if __name__ == "__main__":
    main()
