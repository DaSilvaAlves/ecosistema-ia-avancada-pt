#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pipeline de Video AI — Comunidade IA Avancada PT
Eurico Alves | ia-avancada-pt.vercel.app

Fluxo padrao (heygen_tts): Script -> HeyGen TTS PT-PT + Avatar -> MP4 pronto
Fluxo alternativo (elevenlabs): Script -> ElevenLabs -> HeyGen Avatar -> MP4 pronto

Uso:
  python pipeline.py --list                     lista todos os scripts
  python pipeline.py --id 01-A                  gera o video 01-A
  python pipeline.py --id 01-A --id 01-B        gera multiplos
  python pipeline.py --prioridade HOJE           gera todos marcados HOJE
  python pipeline.py --texto "Texto..." --slug "nome"   video de texto livre
  python pipeline.py --lista-avatares            lista avatares disponiveis
  python pipeline.py --lista-vozes               lista vozes PT-PT disponiveis
"""

import json
import os
import sys
import time
import argparse
import requests
from datetime import datetime
from pathlib import Path

# Forcar UTF-8 no output do terminal Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr.encoding != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = Path(__file__).parent
CONFIG_FILE = BASE_DIR / "config.json"
SCRIPTS_FILE = BASE_DIR / "scripts.json"
OUTPUT_DIR = BASE_DIR / "output"

# ──────────────────────────────────────────────
# CONFIGURACAO
# ──────────────────────────────────────────────

def carregar_config():
    if not CONFIG_FILE.exists():
        print("[ERRO] config.json nao encontrado.")
        sys.exit(1)
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def carregar_scripts():
    if not SCRIPTS_FILE.exists():
        print("[ERRO] scripts.json nao encontrado.")
        sys.exit(1)
    with open(SCRIPTS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)["scripts"]

def validar_config(config):
    hg = config["heygen"]
    erros = []
    if not hg.get("api_key") or "COLOCA_AQUI" in hg["api_key"]:
        erros.append("HeyGen API key nao configurada")
    if not hg.get("avatar_id") or "COLOCA_AQUI" in hg["avatar_id"]:
        erros.append("HeyGen avatar_id nao configurado")
    if not hg.get("voice_id") or "COLOCA_AQUI" in hg["voice_id"]:
        erros.append("HeyGen voice_id nao configurado")

    modo = config.get("_modo", "heygen_tts")
    if modo == "elevenlabs":
        el = config["elevenlabs"]
        if not el.get("api_key") or "COLOCA_AQUI" in el["api_key"]:
            erros.append("ElevenLabs API key nao configurada (necessaria no modo elevenlabs)")
        if not el.get("voice_id") or "COLOCA_AQUI" in el["voice_id"]:
            erros.append("ElevenLabs voice_id nao configurado (necessario no modo elevenlabs)")

    if erros:
        print("\n[CONFIG INCOMPLETA]")
        for e in erros:
            print(f"  - {e}")
        print("\nAbre config.json e preenche os campos em falta.\n")
        sys.exit(1)

# ──────────────────────────────────────────────
# MODO 1 — HEYGEN TTS NATIVO (padrao)
# Texto -> HeyGen (audio + avatar) -> MP4
# ──────────────────────────────────────────────

def gerar_video_heygen_tts(texto, config):
    """Gera video diretamente no HeyGen usando TTS nativo PT-PT."""
    hg = config["heygen"]
    url = "https://api.heygen.com/v2/video/generate"
    headers = {
        "X-Api-Key": hg["api_key"],
        "Content-Type": "application/json"
    }
    payload = {
        "video_inputs": [
            {
                "character": {
                    "type": "avatar",
                    "avatar_id": hg["avatar_id"],
                    "avatar_style": hg.get("avatar_style", "normal")
                },
                "voice": {
                    "type": "text",
                    "input_text": texto,
                    "voice_id": hg["voice_id"],
                    "speed": hg.get("voice_speed", 1.0)
                },
                "background": {
                    "type": "color",
                    "value": "#0a0a0a"
                }
            }
        ],
        "dimension": {
            "width": hg.get("width", 1080),
            "height": hg.get("height", 1920)
        },
        "test": config.get("_test_mode", False)
    }

    print("  [1/2] HeyGen: a submeter pedido de video (TTS + avatar)...")
    r = requests.post(url, headers=headers, json=payload, timeout=60)

    if r.status_code == 401:
        print("[ERRO] HeyGen: API key invalida.")
        sys.exit(1)
    if r.status_code == 400:
        detail = r.text
        print(f"[ERRO] HeyGen: pedido invalido. Detalhe: {detail}")
        print("  Verifica avatar_id e voice_id em config.json")
        print("  Usa: python pipeline.py --lista-avatares")
        print("  Usa: python pipeline.py --lista-vozes")
        sys.exit(1)
    if r.status_code == 429:
        print("[ERRO] HeyGen: limite de pedidos atingido. Aguarda alguns minutos.")
        sys.exit(1)
    if r.status_code not in (200, 201):
        print(f"[ERRO] HeyGen: {r.status_code} — {r.text[:300]}")
        sys.exit(1)

    data = r.json()
    video_id = data.get("data", {}).get("video_id") or data.get("video_id")
    if not video_id:
        print(f"[ERRO] HeyGen: video_id nao encontrado. Resposta: {data}")
        sys.exit(1)

    print(f"  [1/2] Video submetido. ID: {video_id}")
    return video_id

# ──────────────────────────────────────────────
# MODO 2 — ELEVENLAB + HEYGEN
# Texto -> ElevenLabs (audio) -> HeyGen (avatar) -> MP4
# ──────────────────────────────────────────────

def gerar_audio_elevenlabs(texto, config, caminho_saida):
    el = config["elevenlabs"]
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{el['voice_id']}"
    headers = {
        "xi-api-key": el["api_key"],
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
    }
    payload = {
        "text": texto,
        "model_id": el["model_id"],
        "voice_settings": {
            "stability": el["stability"],
            "similarity_boost": el["similarity_boost"],
            "style": el["style"],
            "use_speaker_boost": True
        }
    }
    print("  [1/3] ElevenLabs: a gerar audio...")
    r = requests.post(url, headers=headers, json=payload, timeout=60)
    if r.status_code == 402:
        print("[ERRO] ElevenLabs: plano pago necessario para usar vozes da biblioteca.")
        print("  Opcao 1: usa o modo padrao (heygen_tts) em config.json")
        print("  Opcao 2: cria uma voz propria no ElevenLabs e usa o seu ID")
        sys.exit(1)
    if r.status_code != 200:
        print(f"[ERRO] ElevenLabs: {r.status_code} — {r.text[:200]}")
        sys.exit(1)
    with open(caminho_saida, "wb") as f:
        f.write(r.content)
    print(f"  [1/3] Audio gerado: {len(r.content)//1024} KB")
    return caminho_saida

def upload_audio_heygen(caminho_audio, config):
    hg = config["heygen"]
    url = "https://upload.heygen.com/v1/asset"
    headers = {"X-Api-Key": hg["api_key"], "Content-Type": "audio/mpeg"}
    print("  [2/3] HeyGen: a fazer upload do audio...")
    with open(caminho_audio, "rb") as f:
        r = requests.post(url, headers=headers, data=f, timeout=60)
    if r.status_code not in (200, 201):
        print(f"[ERRO] HeyGen upload: {r.status_code} — {r.text[:200]}")
        sys.exit(1)
    data = r.json()
    asset_id = data.get("data", {}).get("id")
    asset_url = data.get("data", {}).get("url")
    print(f"  [2/3] Upload concluido.")
    return asset_id, asset_url

def gerar_video_com_audio(asset_id, asset_url, config):
    hg = config["heygen"]
    url = "https://api.heygen.com/v2/video/generate"
    headers = {"X-Api-Key": hg["api_key"], "Content-Type": "application/json"}
    voz = {"type": "audio", "audio_asset_id": asset_id} if asset_id else {"type": "audio", "audio_url": asset_url}
    payload = {
        "video_inputs": [{
            "character": {"type": "avatar", "avatar_id": hg["avatar_id"], "avatar_style": hg.get("avatar_style", "normal")},
            "voice": voz,
            "background": {"type": "color", "value": "#0a0a0a"}
        }],
        "dimension": {"width": hg.get("width", 1080), "height": hg.get("height", 1920)},
        "test": config.get("_test_mode", False)
    }
    print("  [3/3] HeyGen: a submeter pedido de video...")
    r = requests.post(url, headers=headers, json=payload, timeout=60)
    if r.status_code not in (200, 201):
        print(f"[ERRO] HeyGen: {r.status_code} — {r.text[:300]}")
        sys.exit(1)
    data = r.json()
    video_id = data.get("data", {}).get("video_id") or data.get("video_id")
    print(f"  [3/3] Video submetido. ID: {video_id}")
    return video_id

# ──────────────────────────────────────────────
# AGUARDAR E DESCARREGAR (igual nos dois modos)
# ──────────────────────────────────────────────

def aguardar_e_descarregar(video_id, caminho_saida, config):
    hg = config["heygen"]
    url_status = f"https://api.heygen.com/v1/video_status.get?video_id={video_id}"
    headers = {"X-Api-Key": hg["api_key"]}

    print(f"  Aguarda o HeyGen renderizar (tipicamente 2-5 min)...")
    tentativas = 0
    max_tentativas = 72  # 6 minutos

    while tentativas < max_tentativas:
        time.sleep(5)
        tentativas += 1
        r = requests.get(url_status, headers=headers, timeout=30)
        if r.status_code != 200:
            continue

        data = r.json()
        status = data.get("data", {}).get("status") or data.get("status", "")

        if tentativas % 6 == 0:
            print(f"  ... {tentativas * 5}s — estado: {status}")

        if status == "completed":
            video_url = data.get("data", {}).get("video_url") or data.get("video_url")
            if not video_url:
                print("[ERRO] Video pronto mas URL em falta.")
                sys.exit(1)
            print(f"  Pronto! A descarregar...")
            r_video = requests.get(video_url, timeout=120)
            with open(caminho_saida, "wb") as f:
                f.write(r_video.content)
            tamanho_mb = len(r_video.content) / (1024 * 1024)
            print(f"  Guardado: {caminho_saida.name} ({tamanho_mb:.1f} MB)")
            return caminho_saida

        elif status == "failed":
            erro = data.get("data", {}).get("error", {})
            print(f"[ERRO] HeyGen falhou: {erro}")
            sys.exit(1)

    print("[ERRO] Timeout. O HeyGen demorou mais de 6 minutos.")
    sys.exit(1)

# ──────────────────────────────────────────────
# ORQUESTRADOR
# ──────────────────────────────────────────────

def gerar_video_completo(script_texto, slug, config):
    OUTPUT_DIR.mkdir(exist_ok=True)
    data_hoje = datetime.now().strftime("%Y%m%d")
    nome_base = f"video-{data_hoje}-{slug}"
    caminho_video = OUTPUT_DIR / f"{nome_base}.mp4"

    print(f"\n{'='*55}")
    print(f"  A gerar: {slug}")
    print(f"{'='*55}")

    modo = config.get("_modo", "heygen_tts")

    if modo == "free":
        return gerar_video_free_stack(script_texto, slug, config)

    elif modo == "did":
        # D-ID: foto real do Eurico + TTS PT-PT nativo
        talk_id, _ = gerar_video_did(script_texto, config)
        resultado = aguardar_e_descarregar_did(talk_id, caminho_video, config)
        print(f"\n  [PRONTO] {resultado.resolve()}")
        return resultado

    elif modo == "elevenlabs":
        caminho_audio = OUTPUT_DIR / f"{nome_base}.mp3"
        gerar_audio_elevenlabs(script_texto, config, caminho_audio)
        asset_id, asset_url = upload_audio_heygen(caminho_audio, config)
        video_id = gerar_video_com_audio(asset_id, asset_url, config)
    else:
        # Modo padrao: HeyGen TTS nativo
        video_id = gerar_video_heygen_tts(script_texto, config)

    resultado = aguardar_e_descarregar(video_id, caminho_video, config)
    print(f"\n  [PRONTO] {resultado.resolve()}")
    return resultado

# ──────────────────────────────────────────────
# MODO FREE — Azure TTS + Wav2Lip (HuggingFace) + FFmpeg
# Custo: €0 | Precisa: conta HuggingFace (gratis) + Azure Speech (gratis)
# ──────────────────────────────────────────────

EURICO_IMG = Path("C:/Users/XPS/Documents/imersao-tools/landing-page/eurico.png")

def _acordar_space(space_id, hf_token):
    """Verifica e acorda o HuggingFace Space se estiver em sleep."""
    try:
        r = requests.get(
            f"https://huggingface.co/api/spaces/{space_id}",
            headers={"Authorization": f"Bearer {hf_token}"},
            timeout=10
        )
        stage = r.json().get("runtime", {}).get("stage", "UNKNOWN")
        if stage == "RUNNING":
            return
        print(f"  Space em estado '{stage}' — a acordar (aguarda 30s)...")
        import time
        time.sleep(30)
    except Exception:
        pass  # se falhar, tenta na mesma

def _get_ffmpeg():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        raise RuntimeError("imageio-ffmpeg nao instalado. Corre: pip install imageio-ffmpeg")

def gerar_audio_azure(texto, config, caminho_saida):
    """Azure Neural TTS PT-PT — gratis 500k chars/mes."""
    fs = config["free_stack"]
    key = fs["azure_tts_key"]
    region = fs.get("azure_tts_region", "westeurope")
    voice = fs.get("azure_voice", "pt-PT-DuarteNeural")

    if "COLOCA_AQUI" in key:
        raise RuntimeError("Azure TTS key nao configurada em config.json (free_stack.azure_tts_key)")

    # Obter token de acesso
    token_url = f"https://{region}.api.cognitive.microsoft.com/sts/v1.0/issueToken"
    token_r = requests.post(token_url, headers={"Ocp-Apim-Subscription-Key": key}, timeout=15)
    if token_r.status_code != 200:
        raise RuntimeError(f"Azure TTS auth falhou: {token_r.status_code} {token_r.text[:100]}")
    token = token_r.text

    # Gerar audio
    ssml = f"""<speak version='1.0' xml:lang='pt-PT'>
  <voice name='{voice}'>{texto}</voice>
</speak>"""
    tts_url = f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-48khz-96kbitrate-mono-mp3"
    }
    r = requests.post(tts_url, headers=headers, data=ssml.encode("utf-8"), timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"Azure TTS falhou: {r.status_code} {r.text[:200]}")

    with open(caminho_saida, "wb") as f:
        f.write(r.content)
    print(f"  [1/3] Azure TTS: audio PT-PT gerado ({len(r.content)//1024} KB)")
    return caminho_saida

def criar_video_base(caminho_saida, duracao=30):
    """Cria video loop da foto do Eurico para usar como base no Wav2Lip."""
    ffmpeg = _get_ffmpeg()
    import subprocess
    cmd = [
        ffmpeg, "-y",
        "-loop", "1",
        "-i", str(EURICO_IMG),
        "-t", str(duracao + 2),
        "-vf", "scale=480:480:force_original_aspect_ratio=decrease,pad=480:480:(ow-iw)/2:(oh-ih)/2",
        "-r", "25",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        str(caminho_saida)
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg falhou a criar video base: {result.stderr[-200:]}")
    print(f"  [2/3] Video base criado a partir de eurico.png")
    return caminho_saida

def wav2lip_huggingface(video_base, audio_mp3, config, caminho_saida):  # video_base ignorado (usa eurico.png)
    """Envia foto + audio ao Wav2Lip no HuggingFace Space e descarrega o resultado."""
    from gradio_client import Client, handle_file
    fs = config["free_stack"]
    hf_token = fs.get("huggingface_token", "")
    space = fs.get("hf_space", "manavisrani07/gradio-lipsync-wav2lip")

    if "COLOCA_AQUI" in hf_token:
        raise RuntimeError("HuggingFace token nao configurado em config.json (free_stack.huggingface_token)")

    print(f"  [3/3] Wav2Lip HF: a processar lip-sync (pode demorar 2-5 min)...")
    import tempfile
    tmp_dir = Path(tempfile.gettempdir()) / "wav2lip_output"
    tmp_dir.mkdir(exist_ok=True)

    # Acordar o Space se necessario
    _acordar_space("pragnakalp/Wav2lip-ZeroGPU", hf_token)

    client = Client(
        "pragnakalp/Wav2lip-ZeroGPU",
        token=hf_token,
        verbose=False,
        download_files=False,
        httpx_kwargs={"timeout": 120}
    )
    result = client.predict(
        input_image=handle_file(str(EURICO_IMG)),  # usa a foto directamente
        input_audio=handle_file(str(audio_mp3)),
        api_name="/run_infrence"
    )

    # Extrair URL (este Space guarda em /tmp/gradio/ — acessivel)
    result_url = None
    if isinstance(result, dict) and isinstance(result.get("video"), dict):
        result_url = result["video"].get("url")
    if not result_url:
        raise RuntimeError(f"Wav2Lip: URL nao encontrada na resposta: {result}")

    print(f"  A descarregar resultado...")
    r_dl = requests.get(result_url, headers={"Authorization": f"Bearer {hf_token}"}, timeout=120)
    if r_dl.status_code != 200:
        raise RuntimeError(f"Download falhou: {r_dl.status_code} {r_dl.text[:100]}")

    result_path = tmp_dir / "output.mp4"
    with open(result_path, "wb") as f:
        f.write(r_dl.content)
    print(f"  Download concluido ({len(r_dl.content)//1024} KB)")

    # Converter para 9:16 com FFmpeg
    ffmpeg = _get_ffmpeg()
    import subprocess
    cmd_final = [
        ffmpeg, "-y",
        "-i", str(result_path),
        "-vf", "scale=1080:1080,pad=1080:1920:0:420:black",
        "-c:v", "libx264",
        "-c:a", "aac",
        "-pix_fmt", "yuv420p",
        str(caminho_saida)
    ]
    r2 = subprocess.run(cmd_final, capture_output=True, text=True)
    if r2.returncode != 0:
        # se FFmpeg falhar, guarda o resultado directo
        import shutil
        shutil.copy(str(result_path), str(caminho_saida))

    print(f"  [3/3] Lip-sync concluido. Video 9:16 guardado.")
    return caminho_saida

def gerar_video_free_stack(script_texto, slug, config):
    """Orquestra o stack gratuito: Azure TTS + Wav2Lip HF + FFmpeg."""
    OUTPUT_DIR.mkdir(exist_ok=True)
    data_hoje = datetime.now().strftime("%Y%m%d")
    nome_base = f"video-{data_hoje}-{slug}"

    caminho_audio = OUTPUT_DIR / f"{nome_base}.mp3"
    caminho_final = OUTPUT_DIR / f"{nome_base}.mp4"

    print(f"\n{'='*55}")
    print(f"  [FREE STACK] A gerar: {slug}")
    print(f"  Azure TTS (PT-PT) + Wav2Lip HuggingFace + FFmpeg")
    print(f"  Custo: EUR 0")
    print(f"{'='*55}")

    # Passo 1: Audio PT-PT (Azure neural ou gTTS fallback)
    azure_key = config.get("free_stack", {}).get("azure_tts_key", "")
    if "COLOCA_AQUI" in azure_key or not azure_key:
        print("  [1/2] Azure nao configurado — a usar gTTS (PT) como fallback...")
        from gtts import gTTS
        tts = gTTS(text=script_texto, lang="pt", tld="pt")
        tts.save(str(caminho_audio))
        print(f"  [1/2] gTTS: audio PT gerado ({caminho_audio.stat().st_size//1024} KB)")
    else:
        gerar_audio_azure(script_texto, config, caminho_audio)

    # Passo 2: Lip-sync com foto do Eurico (HuggingFace ZeroGPU)
    wav2lip_huggingface(None, caminho_audio, config, caminho_final)
    print(f"\n  [PRONTO] {caminho_final.resolve()}")
    return caminho_final

# ──────────────────────────────────────────────
# MODO 3 — D-ID (foto real + TTS PT-PT nativo)
# Foto Eurico + Texto -> D-ID (anima a foto com voz PT-PT) -> MP4
# ──────────────────────────────────────────────

def gerar_video_did(texto, config):
    """Gera video com D-ID: anima a foto do Eurico com TTS PT-PT."""
    did = config["did"]
    import base64

    # Autenticacao D-ID: Basic base64(email:api_key)
    credenciais = base64.b64encode(f"{did['email']}:{did['api_key']}".encode()).decode()
    headers = {
        "Authorization": f"Basic {credenciais}",
        "Content-Type": "application/json"
    }

    payload = {
        "source_url": did.get("avatar_url", "https://ia-avancada-pt.vercel.app/eurico.png"),
        "script": {
            "type": "text",
            "input": texto,
            "provider": {
                "type": "microsoft",
                "voice_id": did.get("voice_id", "pt-PT-DuarteNeural")
            }
        },
        "config": {
            "fluent": True,
            "pad_audio": 0.0
        }
    }

    print("  [1/2] D-ID: a submeter pedido de video (foto + TTS PT-PT)...")
    r = requests.post("https://api.d-id.com/talks", headers=headers, json=payload, timeout=60)

    if r.status_code == 401:
        print("[ERRO] D-ID: credenciais invalidas. Verifica email e api_key em config.json.")
        sys.exit(1)
    if r.status_code == 402:
        print("[ERRO] D-ID: creditos insuficientes. Vai a d-id.com e carrega creditos.")
        sys.exit(1)
    if r.status_code not in (200, 201):
        print(f"[ERRO] D-ID: {r.status_code} — {r.text[:300]}")
        sys.exit(1)

    data = r.json()
    talk_id = data.get("id")
    if not talk_id:
        print(f"[ERRO] D-ID: talk_id nao encontrado. Resposta: {data}")
        sys.exit(1)

    print(f"  [1/2] Video submetido ao D-ID. ID: {talk_id}")
    return talk_id, "did"

def aguardar_e_descarregar_did(talk_id, caminho_saida, config):
    """Faz polling ao D-ID e descarrega o MP4 quando pronto."""
    did = config["did"]
    import base64

    credenciais = base64.b64encode(f"{did['email']}:{did['api_key']}".encode()).decode()
    headers = {"Authorization": f"Basic {credenciais}"}
    url_status = f"https://api.d-id.com/talks/{talk_id}"

    print(f"  Aguarda o D-ID renderizar (tipicamente 1-3 min)...")
    tentativas = 0
    max_tentativas = 72

    while tentativas < max_tentativas:
        time.sleep(5)
        tentativas += 1
        r = requests.get(url_status, headers=headers, timeout=30)
        if r.status_code != 200:
            continue

        data = r.json()
        status = data.get("status", "")

        if tentativas % 6 == 0:
            print(f"  ... {tentativas * 5}s — estado: {status}")

        if status == "done":
            video_url = data.get("result_url")
            if not video_url:
                print("[ERRO] D-ID: video pronto mas URL em falta.")
                sys.exit(1)
            print(f"  Pronto! A descarregar...")
            r_video = requests.get(video_url, timeout=120)
            with open(caminho_saida, "wb") as f:
                f.write(r_video.content)
            tamanho_mb = len(r_video.content) / (1024 * 1024)
            print(f"  Guardado: {caminho_saida.name} ({tamanho_mb:.1f} MB)")
            return caminho_saida

        elif status == "error":
            erro = data.get("error", {})
            print(f"[ERRO] D-ID falhou: {erro}")
            sys.exit(1)

    print("[ERRO] Timeout. D-ID demorou mais de 6 minutos.")
    sys.exit(1)

# ──────────────────────────────────────────────
# COMANDOS DE DESCOBERTA
# ──────────────────────────────────────────────

def listar_avatares(config):
    hg = config["heygen"]
    r = requests.get("https://api.heygen.com/v2/avatars", headers={"X-Api-Key": hg["api_key"]})
    avatars = r.json().get("data", {}).get("avatars", [])
    print(f"\nTotal avatares disponiveis: {len(avatars)}")
    print(f"{'ID':<45} {'Nome'}")
    print("-" * 80)
    for a in avatars[:50]:
        print(f"  {a.get('avatar_id',''):<43} {a.get('avatar_name','')}")
    if len(avatars) > 50:
        print(f"  ... (+{len(avatars)-50} mais)")
    print(f"\nAvatar actual: {hg['avatar_id']}")
    print("Para mudar: edita 'avatar_id' em config.json\n")

def listar_vozes_pt(config):
    hg = config["heygen"]
    r = requests.get("https://api.heygen.com/v2/voices", headers={"X-Api-Key": hg["api_key"]})
    voices = r.json().get("data", {}).get("voices", [])
    pt = [v for v in voices if "portuguese" in v.get("language", "").lower()]
    print(f"\nVozes Portugues no HeyGen ({len(pt)} total):")
    print(f"{'ID':<40} {'Nome':<35} {'Genero'}")
    print("-" * 80)
    for v in pt:
        print(f"  {v.get('voice_id',''):<38} {v.get('name',''):<35} {v.get('gender','')}")
    print(f"\nVoz actual: {hg['voice_id']}")
    print("Recomendacoes PT-PT (Portugal):")
    print("  9a73e358ebf44097b8d3b6bc5fa57454 | Duarte - Natural (masculino)")
    print("  ff5719e3a6314ecea47badcbb1c0ffaa | Ines - Friendly (feminino)")
    print("  02bcf8702a424226a520b6229f318004 | Cristiano - Friendly (masculino)")
    print("Para mudar: edita 'voice_id' em config.json\n")

def listar_scripts(scripts):
    print("\nScripts disponiveis:\n")
    print(f"  {'ID':<8} {'PRIORIDADE':<15} {'PLATAFORMA':<15} {'TITULO'}")
    print("  " + "-" * 68)
    for s in scripts:
        nota = " [texto]" if s.get("_nota") else ""
        print(f"  {s['id']:<8} {s['prioridade']:<15} {s['plataforma']:<15} {s['titulo']}{nota}")
    print()
    print("  python pipeline.py --id 01-A")
    print("  python pipeline.py --prioridade HOJE")
    print()

# ──────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Pipeline de Video AI — IA Avancada PT",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--list", action="store_true", help="Lista scripts disponiveis")
    parser.add_argument("--lista-avatares", action="store_true", help="Lista avatares HeyGen")
    parser.add_argument("--lista-vozes", action="store_true", help="Lista vozes PT HeyGen")
    parser.add_argument("--id", action="append", metavar="ID", help="ID do script (repete para varios)")
    parser.add_argument("--prioridade", metavar="PRIORIDADE", help="Gera todos com esta prioridade")
    parser.add_argument("--texto", metavar="TEXTO", help="Texto livre para video avulso")
    parser.add_argument("--slug", metavar="SLUG", default="avulso", help="Nome do ficheiro (com --texto)")
    args = parser.parse_args()

    config = carregar_config()
    scripts = carregar_scripts()

    if args.list:
        listar_scripts(scripts)
        return

    if args.lista_avatares:
        listar_avatares(config)
        return

    if args.lista_vozes:
        listar_vozes_pt(config)
        return

    if args.texto:
        validar_config(config)
        gerar_video_completo(args.texto, args.slug, config)
        return

    scripts_a_gerar = []
    if args.id:
        for id_pedido in args.id:
            s = next((x for x in scripts if x["id"] == id_pedido), None)
            if not s:
                print(f"[ERRO] Script '{id_pedido}' nao encontrado. Usa --list.")
                sys.exit(1)
            scripts_a_gerar.append(s)

    if args.prioridade:
        scripts_a_gerar = [s for s in scripts if s.get("prioridade") == args.prioridade.upper()]
        if not scripts_a_gerar:
            print(f"[AVISO] Nenhum script com prioridade '{args.prioridade}'.")
            listar_scripts(scripts)
            return

    if not scripts_a_gerar:
        parser.print_help()
        print("\nExemplos:\n  python pipeline.py --list")
        print("  python pipeline.py --id 01-A")
        print("  python pipeline.py --prioridade HOJE\n")
        return

    validar_config(config)
    resultados = []

    for s in scripts_a_gerar:
        if s.get("_nota") and "texto apenas" in s.get("_nota", ""):
            print(f"\n[INFO] {s['id']} — post de texto (LinkedIn), nao precisa de video.")
            print(f"  Texto:\n  {s['script'][:200]}...\n")
            continue
        resultado = gerar_video_completo(s["script"], s["slug"], config)
        resultados.append((s, resultado))

    if resultados:
        print(f"\n{'='*55}")
        print(f"  CONCLUIDO — {len(resultados)} video(s) gerado(s):")
        for s, caminho in resultados:
            print(f"    [{s['id']}] {caminho.name}")
        print(f"\n  Pasta: {OUTPUT_DIR.resolve()}")
        print(f"{'='*55}\n")

if __name__ == "__main__":
    main()
