#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gerador de Cenas — Comunidade IA Avancada PT
Fundos gerados de raiz em Python. Cada cena tem visual unico.
Output: clips MP4 9:16 + audio MP3 prontos para CapCut

Uso:
  python create_scenes.py --id 01-A
  python create_scenes.py --id 01-A --preview
  python create_scenes.py --list
  python create_scenes.py --limpar-cache
"""

import sys, os, json, subprocess, requests, shutil, argparse, math, random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance, ImageChops
import numpy as np
import io

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

W, H = 1080, 1920

BASE         = Path("C:/Users/XPS/Documents/imersao-tools")
EURICO_IMG   = BASE / "landing-page/eurico.png"
CONFIG_FILE  = BASE / "video-pipeline/config.json"
SCRIPTS_FILE = BASE / "video-pipeline/scripts.json"
OUTPUT_DIR   = BASE / "video-pipeline/output/scenes"
CACHE_DIR    = BASE / "video-pipeline/.cache"

FONTS = {
    "impact": "C:/Windows/Fonts/impact.ttf",
    "bold":   "C:/Windows/Fonts/arialbd.ttf",
    "reg":    "C:/Windows/Fonts/arial.ttf",
    "black":  "C:/Windows/Fonts/seguibl.ttf",
}

WHITE   = (255, 255, 255, 255)
CYAN    = (0,   220, 255, 255)
GOLD    = (255, 200,  30, 255)
ORANGE  = (255, 130,  30, 255)
MAGENTA = (255,  50, 220, 255)
RED     = (255,  60,  60, 255)

# ═══════════════════════════════════════════════
# GERADORES DE FUNDO (um por estilo visual)
# ═══════════════════════════════════════════════

def bg_neural_network(seed=0, cor_base=(0,10,30), cor_nodes=(0,180,255), cor_accent=(255,200,30)):
    """Rede neural: nos ligados por linhas, estilo AI cerebro."""
    rng = random.Random(seed)
    img = Image.new("RGBA", (W, H), cor_base + (255,))
    draw = ImageDraw.Draw(img)

    # Gradiente de fundo radial (brilho ao centro)
    center_x, center_y = W // 2, H // 2
    arr = np.zeros((H, W, 4), dtype=np.uint8)
    arr[:, :, 0] = cor_base[0]
    arr[:, :, 1] = cor_base[1]
    arr[:, :, 2] = cor_base[2]
    for y in range(0, H, 4):
        for x in range(0, W, 4):
            dist = math.sqrt((x - center_x)**2 + (y - center_y)**2)
            brightness = max(0, 1 - dist / 900)
            r = int(cor_base[0] + brightness * 40)
            g = int(cor_base[1] + brightness * 30)
            b = int(cor_base[2] + brightness * 60)
            arr[y:y+4, x:x+4, 0] = min(255, r)
            arr[y:y+4, x:x+4, 1] = min(255, g)
            arr[y:y+4, x:x+4, 2] = min(255, b)
            arr[y:y+4, x:x+4, 3] = 255
    img = Image.fromarray(arr, "RGBA")
    draw = ImageDraw.Draw(img)

    # Gerar nos aleatoriamente
    nos = [(rng.randint(50, W-50), rng.randint(80, H-80)) for _ in range(55)]

    # Ligar nos proximos com linhas
    for i, (x1, y1) in enumerate(nos):
        for j, (x2, y2) in enumerate(nos[i+1:], i+1):
            dist = math.sqrt((x2-x1)**2 + (y2-y1)**2)
            if dist < 280:
                alpha = int(80 * (1 - dist/280))
                r, g, b = cor_nodes
                draw.line([(x1,y1),(x2,y2)], fill=(r, g, b, alpha), width=1)

    # Desenhar nos
    for idx, (x, y) in enumerate(nos):
        r_size = rng.randint(3, 10)
        # Glow
        for glow in range(r_size+8, r_size, -2):
            a = int(40 * (r_size / glow))
            draw.ellipse([(x-glow, y-glow),(x+glow, y+glow)],
                         fill=(*cor_nodes, a))
        # No principal
        draw.ellipse([(x-r_size, y-r_size),(x+r_size, y+r_size)],
                     fill=(*cor_nodes, 200))
        # Destaque (accent) em alguns nos
        if idx % 7 == 0:
            draw.ellipse([(x-r_size//2, y-r_size//2),(x+r_size//2, y+r_size//2)],
                         fill=(*cor_accent, 255))
    return img


def bg_particles_flow(seed=0, cor1=(0,8,25), cor2=(0,150,220), densidade=120):
    """Particulas flutuantes com trilhos de luz — estilo cosmos/energia."""
    rng = random.Random(seed)
    arr = np.zeros((H, W, 4), dtype=np.uint8)
    # Base gradient vertical
    for y in range(H):
        t = y / H
        r = int(cor1[0] * (1-t) + cor2[0]*0.15 * t)
        g = int(cor1[1] * (1-t) + cor2[1]*0.15 * t)
        b = int(cor1[2] * (1-t) + cor2[2]*0.3  * t)
        arr[y, :, 0] = min(255, r)
        arr[y, :, 1] = min(255, g)
        arr[y, :, 2] = min(255, b)
        arr[y, :, 3] = 255
    img = Image.fromarray(arr, "RGBA")
    draw = ImageDraw.Draw(img)

    for _ in range(densidade):
        x = rng.randint(0, W)
        y = rng.randint(0, H)
        tamanho = rng.randint(1, 5)
        alpha = rng.randint(60, 200)
        # Variacao entre cor2 e branco
        mix = rng.random()
        r = int(cor2[0]*mix + 255*(1-mix))
        g = int(cor2[1]*mix + 255*(1-mix))
        b = int(cor2[2]*mix + 255*(1-mix))
        # Glow suave
        for g_r in range(tamanho+6, tamanho, -2):
            draw.ellipse([(x-g_r,y-g_r),(x+g_r,y+g_r)], fill=(r,g,b, alpha//4))
        draw.ellipse([(x-tamanho,y-tamanho),(x+tamanho,y+tamanho)], fill=(r,g,b,alpha))

    return img


def bg_circuit_board(seed=0, cor_bg=(0,12,8), cor_linha=(0,200,80), cor_accent=(0,255,180)):
    """Placa de circuito — linhas ortogonais, vias, componentes."""
    rng = random.Random(seed)
    img = Image.new("RGBA", (W, H), cor_bg + (255,))
    draw = ImageDraw.Draw(img)

    # Grade de circuito
    passo = 80
    for x in range(0, W, passo):
        for y in range(0, H, passo):
            if rng.random() > 0.4:
                # Linha horizontal ou vertical
                if rng.random() > 0.5:
                    x2 = x + rng.randint(1, 4) * passo
                    draw.line([(x,y),(min(x2,W),y)], fill=(*cor_linha, 60), width=1)
                else:
                    y2 = y + rng.randint(1, 4) * passo
                    draw.line([(x,y),(x,min(y2,H))], fill=(*cor_linha, 60), width=1)

            # Nos (vias)
            if rng.random() > 0.65:
                r = rng.randint(3, 8)
                draw.ellipse([(x-r,y-r),(x+r,y+r)], fill=(*cor_accent, 100))
                draw.ellipse([(x-r//2,y-r//2),(x+r//2,y+r//2)], fill=(*cor_accent, 200))

    # Linhas de destaque
    for _ in range(8):
        x1 = rng.randint(0, W)
        y1 = rng.randint(0, H)
        x2 = x1 + rng.choice([-1,1]) * rng.randint(100, 400)
        draw.line([(x1,y1),(x2,y1)], fill=(*cor_linha, 120), width=2)
        draw.line([(x2,y1),(x2,y1+rng.randint(100,300))], fill=(*cor_linha, 120), width=2)

    return img


def bg_data_stream(seed=0, cor_bg=(5,0,20), cor_chars=(150,0,255), cor_bright=(200,100,255)):
    """Matrix digital — colunas de caracteres a cair."""
    rng = random.Random(seed)
    img = Image.new("RGBA", (W, H), cor_bg + (255,))
    draw = ImageDraw.Draw(img)

    try:
        font_sm = ImageFont.truetype(FONTS["reg"], 16)
        font_xs = ImageFont.truetype(FONTS["reg"], 12)
    except Exception:
        font_sm = ImageFont.load_default()
        font_xs = font_sm

    chars = "01アイウエオカキクケコABCDEF01010101"
    cols = range(20, W-20, 30)
    for col_x in cols:
        comprimento = rng.randint(8, 30)
        start_y = rng.randint(-200, H//2)
        for i in range(comprimento):
            y = start_y + i * 22
            if y < 0 or y > H: continue
            c = rng.choice(chars)
            fade = i / comprimento
            if i == comprimento - 1:
                draw.text((col_x, y), c, font=font_sm, fill=(*cor_bright, 230))
            else:
                alpha = int(180 * fade)
                draw.text((col_x, y), c, font=font_xs, fill=(*cor_chars, alpha))
    return img


def bg_geometric_dark(seed=0, cor_bg=(8,5,15), cor1=(0,200,255), cor2=(180,0,255)):
    """Formas geometricas abstratas — hexagonos, circulos, linhas angulares."""
    rng = random.Random(seed)
    img = Image.new("RGBA", (W, H), cor_bg + (255,))
    draw = ImageDraw.Draw(img)

    # Circulos concentricos ao centro
    cx, cy = W//2, H//2 + 200
    for r in range(50, 700, 80):
        alpha = int(30 + 20 * math.sin(r/100))
        mix = r / 700
        color = (
            int(cor1[0]*(1-mix) + cor2[0]*mix),
            int(cor1[1]*(1-mix) + cor2[1]*mix),
            int(cor1[2]*(1-mix) + cor2[2]*mix),
            alpha
        )
        draw.ellipse([(cx-r, cy-r),(cx+r, cy+r)], outline=color, width=1)

    # Linhas diagonais de canto
    for i in range(0, W, 120):
        draw.line([(i, 0),(0, i)], fill=(*cor1, 20), width=1)
        draw.line([(W-i, H),(W, H-i)], fill=(*cor2, 20), width=1)

    # Hexagonos espalhados
    def hex_pts(cx, cy, r):
        return [(cx + r*math.cos(math.pi/3*i - math.pi/6),
                 cy + r*math.sin(math.pi/3*i - math.pi/6)) for i in range(6)]

    for _ in range(12):
        hx = rng.randint(0, W)
        hy = rng.randint(0, H)
        hr = rng.randint(30, 120)
        alpha = rng.randint(20, 60)
        pts = hex_pts(hx, hy, hr)
        escolha = cor1 if rng.random() > 0.5 else cor2
        draw.polygon(pts, outline=(*escolha, alpha))

    return img


def bg_cityscape_ai(seed=0):
    """Cidade futurista — skyline abstracto com reflexos e luzes neon."""
    rng = random.Random(seed)
    img = Image.new("RGBA", (W, H), (3, 5, 18, 255))
    draw = ImageDraw.Draw(img)

    # Gradiente ceu
    for y in range(H):
        t = y / H
        r = int(3 + t * 5)
        g = int(5 + t * 8)
        b = int(18 + t * 15)
        draw.line([(0, y),(W, y)], fill=(r,g,b,255))

    # Edificios
    horizonte = int(H * 0.62)
    for _ in range(22):
        bw = rng.randint(40, 120)
        bh = rng.randint(80, 500)
        bx = rng.randint(-30, W)
        by = horizonte - bh
        # Edificio base
        draw.rectangle([(bx, by),(bx+bw, horizonte)], fill=(8,12,35,200))
        # Janelas
        for wx in range(bx+8, bx+bw-8, 14):
            for wy in range(by+10, horizonte-5, 18):
                if rng.random() > 0.4:
                    wc = rng.choice([(255,200,30,180),(0,200,255,150),(255,255,255,120)])
                    draw.rectangle([(wx,wy),(wx+8,wy+10)], fill=wc)

    # Reflexo na agua (espelho inferior)
    reflexo = img.crop((0, horizonte-200, W, horizonte))
    reflexo = reflexo.transpose(Image.FLIP_TOP_BOTTOM)
    enhancer = ImageEnhance.Brightness(reflexo)
    reflexo = enhancer.enhance(0.3)
    img.paste(reflexo, (0, horizonte), reflexo)

    # Linha de horizonte neon
    for offset in range(-2, 3):
        alpha = 80 - abs(offset) * 20
        draw.line([(0, horizonte+offset),(W, horizonte+offset)],
                  fill=(0,180,255,alpha), width=1)

    return img


def bg_brain_waves(seed=0, cor_bg=(5,0,15), cor_onda=(100,0,200)):
    """Ondas cerebrais — linhas sinusoidais animadas, estilo EEG/IA."""
    rng = random.Random(seed)
    img = Image.new("RGBA", (W, H), cor_bg + (255,))
    draw = ImageDraw.Draw(img)

    # Multiplas ondas sinusoidais em camadas
    for camada in range(8):
        y_base = int(H * (0.15 + camada * 0.10))
        amp    = rng.randint(20, 80)
        freq   = rng.uniform(0.005, 0.02)
        fase   = rng.uniform(0, math.pi * 2)
        alpha  = rng.randint(40, 120)
        mix    = camada / 8
        r = int(cor_onda[0] * (1-mix) + 0 * mix)
        g = int(cor_onda[1] * (1-mix) + 180 * mix)
        b = int(cor_onda[2] * (1-mix) + 255 * mix)

        pts = []
        for x in range(0, W, 3):
            y = y_base + int(amp * math.sin(freq * x + fase))
            pts.append((x, y))
        if len(pts) > 1:
            draw.line(pts, fill=(r,g,b,alpha), width=2)

    # Pulsos de pico (spikes)
    for _ in range(15):
        sx = rng.randint(50, W-50)
        sy = rng.randint(int(H*0.1), int(H*0.8))
        sh = rng.randint(40, 150)
        draw.line([(sx, sy),(sx, sy-sh)], fill=(200,100,255,180), width=2)
        draw.line([(sx, sy-sh),(sx+15, sy)], fill=(200,100,255,140), width=2)

    return img


# Mapa: nome -> funcao geradora
FUNDOS = {
    "neural_blue":    lambda s: bg_neural_network(s, (0,8,28),  (0,180,255), (255,200,30)),
    "neural_purple":  lambda s: bg_neural_network(s, (10,0,30), (180,0,255), (0,220,255)),
    "neural_gold":    lambda s: bg_neural_network(s, (20,10,0), (255,160,0), (0,200,255)),
    "particles_cyan": lambda s: bg_particles_flow(s, (0,8,25),  (0,200,255), 130),
    "particles_gold": lambda s: bg_particles_flow(s, (18,10,0), (255,180,0), 100),
    "particles_mag":  lambda s: bg_particles_flow(s, (15,0,20), (200,0,255), 110),
    "circuit":        lambda s: bg_circuit_board(s),
    "matrix":         lambda s: bg_data_stream(s),
    "geo_blue":       lambda s: bg_geometric_dark(s, (8,5,15), (0,200,255),(180,0,255)),
    "geo_gold":       lambda s: bg_geometric_dark(s, (15,8,0), (255,180,0),(255,80,0)),
    "city":           lambda s: bg_cityscape_ai(s),
    "brainwaves":     lambda s: bg_brain_waves(s),
}

# ═══════════════════════════════════════════════
# DEFINICAO DAS CENAS
# Cada cena tem: texto, fundo unico, posicao do Eurico, duracao
# ═══════════════════════════════════════════════

CENAS = {
    "01-A": [
        {
            "id": "01", "dur": 2.8,
            "bg": "neural_blue", "bg_seed": 42,
            "eurico": "center", "eurico_scale": 0.72,
            "linhas": [
                ("AINDA FAZES",    "impact", 95,  WHITE),
                ("ISTO",           "impact", 170, CYAN),
                ("MANUALMENTE?",   "impact", 82,  WHITE),
            ],
            "tag": None,
        },
        {
            "id": "02", "dur": 3.2,
            "bg": "city",        "bg_seed": 7,
            "eurico": "right",   "eurico_scale": 0.60,
            "linhas": [
                ("EM PORTUGAL",          "bold",  62, WHITE),
                ("HORAS PERDIDAS",        "impact",105,ORANGE),
                ("EM TAREFAS",            "bold",  58, WHITE),
                ("DE SEGUNDOS.",          "bold",  58, CYAN),
            ],
            "tag": None,
        },
        {
            "id": "03", "dur": 2.5,
            "bg": "particles_cyan", "bg_seed": 13,
            "eurico": "left",       "eurico_scale": 0.65,
            "linhas": [
                ("CRIEI UMA",            "bold",   65, WHITE),
                ("COMUNIDADE",           "impact", 110,CYAN),
                ("PARA ACABAR",          "bold",   60, WHITE),
                ("COM ISSO.",            "bold",   60, GOLD),
            ],
            "tag": "Comunidade IA Avancada PT",
        },
        {
            "id": "04", "dur": 2.2,
            "bg": "circuit",     "bg_seed": 99,
            "eurico": "center",  "eurico_scale": 0.55,
            "linhas": [
                ("FERRAMENTAS",          "impact",  88, GOLD),
                ("REAIS.",               "impact",  88, WHITE),
                ("METODO",               "impact",  88, CYAN),
                ("PROPRIETARIO.",        "impact",  68, WHITE),
            ],
            "tag": None,
        },
        {
            "id": "05", "dur": 2.2,
            "bg": "brainwaves",  "bg_seed": 55,
            "eurico": "right",   "eurico_scale": 0.70,
            "linhas": [
                ("48",                   "impact", 260, CYAN),
                ("HORAS",                "impact", 120, WHITE),
                ("MUDAS TUDO",           "bold",    62, GOLD),
            ],
            "tag": None,
        },
        {
            "id": "06", "dur": 3.2,
            "bg": "neural_gold", "bg_seed": 77,
            "eurico": "center",  "eurico_scale": 0.70,
            "linhas": [
                ("EUR 188",              "impact", 170, GOLD),
                ("VITALICIO",            "impact",  95, WHITE),
                ("LINK NA BIO",          "bold",    68, CYAN),
                ("ia-avancada-pt.vercel.app", "reg",36, (180,180,180,255)),
            ],
            "tag": "Comunidade IA Avancada PT",
        },
    ],

    "01-B": [
        {
            "id": "01", "dur": 2.5,
            "bg": "matrix",      "bg_seed": 10,
            "eurico": "center",  "eurico_scale": 0.60,
            "linhas": [
                ("UM PROFESSOR DO",      "bold",  62, WHITE),
                ("MINISTERIO DA",        "bold",  62, WHITE),
                ("EDUCACAO",             "impact",120,GOLD),
                ("DISSE ISTO:",          "bold",  60, WHITE),
            ],
            "tag": None,
        },
        {
            "id": "02", "dur": 4.0,
            "bg": "geo_blue",    "bg_seed": 33,
            "eurico": "left",    "eurico_scale": 0.58,
            "linhas": [
                ('"Ferramenta eficaz,',  "reg",   52, WHITE),
                ("muito intuitiva.",     "reg",   52, WHITE),
                ("Facilitou o meu",      "reg",   52, WHITE),
                ('dia a dia."',          "bold",  56, CYAN),
            ],
            "tag": "Ruben Silva · Ministerio da Educacao",
        },
        {
            "id": "03", "dur": 2.5,
            "bg": "particles_mag","bg_seed": 22,
            "eurico": "right",   "eurico_scale": 0.68,
            "linhas": [
                ("NIVEL",               "impact",  95, WHITE),
                ("4",                   "impact", 280, MAGENTA),
                ("DE IA",               "bold",    70, WHITE),
            ],
            "tag": None,
        },
        {
            "id": "04", "dur": 2.5,
            "bg": "neural_purple","bg_seed": 44,
            "eurico": "center",  "eurico_scale": 0.65,
            "linhas": [
                ("NAO E MAGIA.",         "impact",  90, WHITE),
                ("E",                    "impact",  80, WHITE),
                ("METODO.",              "impact", 150, GOLD),
            ],
            "tag": "Comunidade IA Avancada PT",
        },
        {
            "id": "05", "dur": 3.0,
            "bg": "geo_gold",    "bg_seed": 66,
            "eurico": "center",  "eurico_scale": 0.68,
            "linhas": [
                ("EUR 188",             "impact", 160, GOLD),
                ("VITALICIO",           "impact",  90, WHITE),
                ("PORTUGAL",            "bold",    65, CYAN),
            ],
            "tag": None,
        },
    ],
}

# ═══════════════════════════════════════════════
# EURICO — remover background uma vez, cachear
# ═══════════════════════════════════════════════

def preparar_eurico():
    cache = CACHE_DIR / "eurico_cutout.png"
    CACHE_DIR.mkdir(exist_ok=True)
    if cache.exists():
        return Image.open(cache).convert("RGBA")
    print("  A remover background do Eurico (rembg, 1a vez ~30s)...")
    from rembg import remove
    with open(EURICO_IMG, "rb") as f:
        resultado = remove(f.read())
    img = Image.open(io.BytesIO(resultado)).convert("RGBA")
    img.save(cache)
    print(f"  Eurico pronto: {img.width}x{img.height}px")
    return img

# ═══════════════════════════════════════════════
# COMPOSICAO DE CENA
# ═══════════════════════════════════════════════

def compositar_cena(cena, eurico_orig):
    bg_fn  = FUNDOS[cena["bg"]]
    bg     = bg_fn(cena["bg_seed"]).convert("RGBA").resize((W, H), Image.LANCZOS)

    canvas = bg.copy()
    draw   = ImageDraw.Draw(canvas)

    # ── Eurico ─────────────────────────────────
    escala    = cena.get("eurico_scale", 0.65)
    alvo_w    = int(W * escala)
    ratio     = alvo_w / eurico_orig.width
    alvo_h    = int(eurico_orig.height * ratio)
    eurico    = eurico_orig.resize((alvo_w, alvo_h), Image.LANCZOS)

    pos_tipo  = cena.get("eurico", "center")
    ey        = H - alvo_h - 60
    if pos_tipo == "center":
        ex = (W - alvo_w) // 2
    elif pos_tipo == "left":
        ex = -30
    else:  # right
        ex = W - alvo_w + 30

    # Sombra suave sob o Eurico
    sombra = Image.new("RGBA", (alvo_w, 80), (0,0,0,0))
    sd     = ImageDraw.Draw(sombra)
    for i in range(80):
        sd.line([(0,i),(alvo_w,i)], fill=(0,0,0, int(100*(i/80)**2)))
    canvas.paste(sombra, (ex, ey + alvo_h - 60), sombra)
    canvas.paste(eurico, (ex, ey), eurico)

    # ── Overlay escuro para legibilidade ───────
    overlay = Image.new("RGBA", (W, H), (0,0,0,0))
    od      = ImageDraw.Draw(overlay)
    # Topo escuro (zona de texto)
    for y in range(int(H * 0.72)):
        t     = 1 - y / (H * 0.72)
        alpha = int(175 * t**0.55)
        od.line([(0,y),(W,y)], fill=(3,5,18,alpha))
    # Fundo escuro (zona de tag)
    for y_off in range(130):
        y     = H - 130 + y_off
        alpha = int(160 * (y_off/130))
        od.line([(0,y),(W,y)], fill=(3,5,18,alpha))
    canvas = Image.alpha_composite(canvas, overlay)
    draw   = ImageDraw.Draw(canvas)

    # ── Linha decorativa neon ──────────────────
    ly = int(H * 0.61)
    draw.line([(60, ly),(W-60, ly)], fill=(0,200,255,50), width=1)

    # ── Texto ──────────────────────────────────
    ty = 110
    for (texto, fonte, tamanho, cor) in cena["linhas"]:
        try:
            font = ImageFont.truetype(FONTS.get(fonte, FONTS["bold"]), tamanho)
        except Exception:
            font = ImageFont.load_default()

        bbox = draw.textbbox((0,0), texto, font=font)
        tw   = bbox[2] - bbox[0]
        tx   = (W - tw) // 2

        # Sombra
        soff = max(2, tamanho // 28)
        draw.text((tx+soff, ty+soff), texto, font=font, fill=(0,0,0,200))

        # Glow neon
        if cor in (CYAN, MAGENTA, GOLD, ORANGE):
            for dx, dy in [(-3,0),(3,0),(0,-3),(0,3),(-2,-2),(2,2)]:
                draw.text((tx+dx, ty+dy), texto, font=font, fill=(*cor[:3], 55))

        draw.text((tx, ty), texto, font=font, fill=cor)
        ty += int((bbox[3]-bbox[1]) * 1.18) + 6

    # ── Tag de rodape ──────────────────────────
    if cena.get("tag"):
        try:
            ftag = ImageFont.truetype(FONTS["bold"], 36)
        except Exception:
            ftag = ImageFont.load_default()
        tb   = draw.textbbox((0,0), cena["tag"], font=ftag)
        tx   = (W - (tb[2]-tb[0])) // 2
        draw.text((tx+2, H-98+2), cena["tag"], font=ftag, fill=(0,0,0,160))
        draw.text((tx, H-98), cena["tag"], font=ftag, fill=CYAN)

    return canvas

# ═══════════════════════════════════════════════
# IMAGEM → VIDEO (Ken Burns zoom + fade in/out)
# ═══════════════════════════════════════════════

def ffmpeg_exe():
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()

EFEITOS = [
    # (descricao, filtro zoompan)
    ("zoom_in_center",
     "zoompan=z='min(zoom+0.004,1.20)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"),
    ("zoom_out_center",
     "zoompan=z='if(eq(on,1),1.20,max(zoom-0.004,1.00))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"),
    ("pan_left_zoom",
     "zoompan=z='min(zoom+0.003,1.15)':x='iw/2-(iw/zoom/2)-on*1.5':y='ih/2-(ih/zoom/2)'"),
    ("pan_right_zoom",
     "zoompan=z='min(zoom+0.003,1.15)':x='iw/2-(iw/zoom/2)+on*1.5':y='ih/2-(ih/zoom/2)'"),
    ("pan_up",
     "zoompan=z='min(zoom+0.003,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)-on*1.2'"),
    ("zoom_in_fast",
     "zoompan=z='min(zoom+0.007,1.30)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"),
]

def imagem_para_video(img_path, video_path, dur, efeito_idx=0):
    frames   = int(dur * 25)
    _, zp    = EFEITOS[efeito_idx % len(EFEITOS)]
    fade_out = max(dur - 0.3, dur * 0.8)
    vf = (
        f"{zp}:d={frames}:s={W}x{H}:fps=25,"
        f"fade=t=in:st=0:d=0.18,"
        f"fade=t=out:st={fade_out:.2f}:d=0.25"
    )
    r = subprocess.run([
        ffmpeg_exe(), "-loop","1","-i", str(img_path),
        "-vf", vf,
        "-t", str(dur), "-r","25",
        "-c:v","libx264", "-pix_fmt","yuv420p", "-preset","fast",
        str(video_path), "-y"
    ], capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"FFmpeg: {r.stderr[-300:]}")


def concatenar_cenas(clips, audio_path, video_final):
    """Junta todos os clips num unico video e adiciona o audio."""
    import tempfile
    lista_txt = Path(tempfile.gettempdir()) / "concat_list.txt"
    with open(lista_txt, "w") as f:
        for c in clips:
            f.write(f"file '{str(c).replace(chr(92), '/')}'\n")

    # Concatenar video
    video_sem_audio = video_final.parent / f"{video_final.stem}_noaudio.mp4"
    r1 = subprocess.run([
        ffmpeg_exe(), "-f","concat","-safe","0",
        "-i", str(lista_txt),
        "-c","copy", str(video_sem_audio), "-y"
    ], capture_output=True, text=True)
    if r1.returncode != 0:
        raise RuntimeError(f"Concat: {r1.stderr[-300:]}")

    # Adicionar audio (corta ou repete para cobrir o video)
    if audio_path and Path(audio_path).exists():
        r2 = subprocess.run([
            ffmpeg_exe(),
            "-i", str(video_sem_audio),
            "-i", str(audio_path),
            "-map","0:v","-map","1:a",
            "-c:v","copy","-c:a","aac",
            "-shortest",
            str(video_final), "-y"
        ], capture_output=True, text=True)
        if r2.returncode != 0:
            raise RuntimeError(f"Audio merge: {r2.stderr[-300:]}")
        video_sem_audio.unlink(missing_ok=True)
    else:
        video_sem_audio.rename(video_final)

    lista_txt.unlink(missing_ok=True)

# ═══════════════════════════════════════════════
# AUDIO — Azure TTS com SSML
# ═══════════════════════════════════════════════

def gerar_audio(texto, config, out_path):
    fs     = config["free_stack"]
    key    = fs["azure_tts_key"]
    region = fs.get("azure_tts_region","westeurope")
    voice  = fs.get("azure_voice","pt-PT-DuarteNeural")

    token_r = requests.post(
        f"https://{region}.api.cognitive.microsoft.com/sts/v1.0/issueToken",
        headers={"Ocp-Apim-Subscription-Key": key}, timeout=15
    )
    if token_r.status_code != 200:
        raise RuntimeError(f"Azure auth: {token_r.status_code}")

    ssml = f"""<speak version='1.0' xml:lang='pt-PT'>
<voice name='{voice}'>
  <prosody rate="-10%" pitch="+2st">{texto}</prosody>
</voice>
</speak>"""

    r = requests.post(
        f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1",
        headers={
            "Authorization": f"Bearer {token_r.text}",
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-48khz-96kbitrate-mono-mp3"
        }, data=ssml.encode("utf-8"), timeout=30
    )
    if r.status_code != 200:
        raise RuntimeError(f"Azure TTS: {r.status_code}")
    with open(out_path,"wb") as f:
        f.write(r.content)
    print(f"  Audio: {len(r.content)//1024} KB")

# ═══════════════════════════════════════════════
# PIPELINE PRINCIPAL
# ═══════════════════════════════════════════════

def gerar(script_id, so_preview=False):
    if script_id not in CENAS:
        print(f"[ERRO] Sem cenas para '{script_id}'. Disponiveis: {list(CENAS.keys())}")
        sys.exit(1)

    cenas  = CENAS[script_id]
    pasta  = OUTPUT_DIR / script_id
    pasta.mkdir(parents=True, exist_ok=True)

    print(f"\n{'='*55}")
    print(f"  {script_id} — {len(cenas)} cenas  |  output: {pasta}")
    print(f"{'='*55}\n")

    print("[1/3] Eurico cutout...")
    eurico = preparar_eurico()

    print(f"[2/3] Cenas ({len(cenas)})...")
    clips_gerados = []
    for i, cena in enumerate(cenas, 1):
        nome_base  = f"cena_{cena['id']}"
        img_path   = pasta / f"{nome_base}.png"
        video_path = pasta / f"{nome_base}.mp4"

        print(f"  {i}/{len(cenas)} [{cena['bg']}]  {cena['linhas'][0][0][:25]}...")
        img = compositar_cena(cena, eurico)
        img.save(str(img_path))

        if not so_preview:
            imagem_para_video(img_path, video_path, cena["dur"], efeito_idx=i-1)
            clips_gerados.append(video_path)
            nome_ef = EFEITOS[(i-1) % len(EFEITOS)][0]
            print(f"    -> {video_path.name}  ({cena['dur']}s)  [{nome_ef}]")

    # Audio
    print(f"\n[3/4] Audio Azure TTS PT-PT...")
    audio_path = None
    try:
        with open(CONFIG_FILE, encoding="utf-8") as f:
            config = json.load(f)
        with open(SCRIPTS_FILE, encoding="utf-8") as f:
            scripts = json.load(f)["scripts"]
        sd = next((s for s in scripts if s["id"] == script_id), None)
        if sd:
            audio_path = pasta / f"audio_{script_id}.mp3"
            if not audio_path.exists():
                gerar_audio(sd["script"], config, audio_path)
            print(f"  -> {audio_path.name}")
    except Exception as e:
        print(f"  [AVISO] Audio: {e}")

    # Video final concatenado
    if clips_gerados:
        print(f"\n[4/4] A concatenar {len(clips_gerados)} cenas + audio...")
        from datetime import datetime
        data = datetime.now().strftime("%Y%m%d")
        video_final = OUTPUT_DIR / f"FINAL_{script_id}_{data}.mp4"
        try:
            concatenar_cenas(clips_gerados, audio_path, video_final)
            tamanho = video_final.stat().st_size // (1024*1024)
            print(f"  -> {video_final.name}  ({tamanho} MB)")
        except Exception as e:
            print(f"  [AVISO] Concat: {e}")

    total = sum(c["dur"] for c in cenas)
    print(f"\n{'='*55}")
    print(f"  PRONTO — {len(cenas)} clips  |  {total:.1f}s total")
    print(f"  {pasta.resolve()}")
    if clips_gerados:
        print(f"\n  VIDEO FINAL: FINAL_{script_id}_{datetime.now().strftime('%Y%m%d')}.mp4")
    print(f"\n  CAPCUT:")
    print(f"    - Usa o FINAL_*.mp4 como base")
    print(f"    - Adiciona musica de fundo")
    print(f"    - Ajusta cortes e exporta")
    print(f"{'='*55}\n")

# ═══════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════

def main():
    p = argparse.ArgumentParser(description="Gerador de Cenas IA Avancada PT")
    p.add_argument("--id",           metavar="ID", help="Script ID (ex: 01-A)")
    p.add_argument("--list",         action="store_true")
    p.add_argument("--preview",      action="store_true", help="So imagens, sem video")
    p.add_argument("--limpar-cache", action="store_true")
    args = p.parse_args()

    if args.list:
        for sid, cs in CENAS.items():
            fundos = [c["bg"] for c in cs]
            print(f"  {sid}  {len(cs)} cenas  fundos: {fundos}")
        return

    if args.limpar_cache:
        if CACHE_DIR.exists():
            shutil.rmtree(CACHE_DIR)
            print("Cache apagado.")
        return

    if not args.id:
        p.print_help()
        return

    gerar(args.id, so_preview=args.preview)

if __name__ == "__main__":
    main()
