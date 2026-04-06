# Como Usar o Pipeline de Video AI
> Comunidade IA Avancada PT | Setup de 10 minutos, depois e automatico

---

## SETUP INICIAL (so uma vez)

### 1. Instalar dependencias
```bash
pip install requests
```

### 2. Configurar as API Keys em config.json

Abre `config.json` e preenche:

#### ElevenLabs
1. Vai a https://elevenlabs.io -> Login
2. Canto superior direito -> **Profile** -> **API Key** -> copia
3. Cola em `"api_key"` no elevenlabs
4. Vai a **Voices** -> escolhe uma voz PT-PT (ex: "Ana") -> clica -> copia o **Voice ID**
5. Cola em `"voice_id"`

**Sugestao de voz PT-PT no ElevenLabs:**
- Procura por "Portuguese" no catalogo de vozes
- Escolhe uma voz feminina ou masculina com sotaque de Portugal (nao Brasil)
- O model `eleven_multilingual_v2` faz boa pronuncia em PT-PT

#### HeyGen
1. Vai a https://app.heygen.com -> Login
2. Settings (rodinha) -> **API** -> **Create API Key** -> copia
3. Cola em `"api_key"` no heygen
4. Vai a **Avatars** -> escolhe um avatar que goste -> clica em **Use in Video**
5. Na URL ou nas definicoes, copia o **Avatar ID**
6. Cola em `"avatar_id"`

---

## USO DIARIO (o que vais fazer de agora em diante)

### Ver todos os scripts disponiveis
```bash
cd C:/Users/XPS/Documents/imersao-tools/video-pipeline
python pipeline.py --list
```

### Gerar os videos de hoje
```bash
python pipeline.py --prioridade HOJE
```

### Gerar um video especifico
```bash
python pipeline.py --id 01-A
python pipeline.py --id 01-B
```

### Gerar multiplos videos de uma vez
```bash
python pipeline.py --id 01-A --id 01-B --id 02
```

### Gerar video com texto livre (sem precisar de estar no scripts.json)
```bash
python pipeline.py --texto "Olá Portugal. Hoje quero falar sobre automatizacao." --slug "video-teste"
```

### Gerar so o audio (para testar a voz antes de gastar creditos HeyGen)
```bash
python pipeline.py --id 01-A --so-audio
```

---

## FLUXO AUTOMATICO

Quando corres `python pipeline.py --id 01-A`, isto e o que acontece automaticamente:

```
[1/3] ElevenLabs: gera audio PT-PT (5-10 segundos)
[2/3] HeyGen: faz upload do audio (5 segundos)
[3/3] HeyGen: gera o video (2-5 minutos)
      Descarrega o MP4 para a pasta output/
```

Tu nao precisas de fazer nada. Esperas e o video aparece em `output/`.

---

## ADICIONAR NOVOS SCRIPTS

Abre `scripts.json` e adiciona um novo objeto ao array `scripts`:

```json
{
  "id": "11",
  "titulo": "Titulo do video",
  "plataforma": "tiktok-reels",
  "duracao_seg": 25,
  "slug": "nome-do-ficheiro",
  "script": "Texto que vai ser falado. Em PT-PT. Frases curtas.",
  "caption": "Caption para publicar nas redes sociais. #hashtag",
  "prioridade": "ESTA_SEMANA"
}
```

**Prioridades possiveis:** `HOJE`, `AMANHA`, `ESTA_SEMANA`, `SEMANA_2`, `MES_2`

---

## ONDE FICAM OS VIDEOS

Todos os videos ficam em:
```
C:/Users/XPS/Documents/imersao-tools/video-pipeline/output/
```

Nome do ficheiro: `video-AAAAMMDD-slug.mp4`
Exemplo: `video-20260308-launch-manualmente.mp4`

---

## REGRAS PARA ESCREVER SCRIPTS (para melhor TTS em PT-PT)

1. **Frases curtas** — maximo 15 palavras por frase
2. **Sem simbolos** — sem €, *, #, emojis no texto falado
3. **Numeros por extenso** — "cento e oitenta e oito euros" em vez de "188€"
4. **Pausa com virgulas** — virgula = pausa curta, ponto = pausa longa
5. **Acentos correctos** — o ElevenLabs le bem PT-PT com acentos

---

## RESOLUCAO DE PROBLEMAS

| Problema | Solucao |
|----------|---------|
| `CONFIG INCOMPLETA` | Preenche as API keys em config.json |
| `ElevenLabs: API key invalida` | Verifica a key em elevenlabs.io -> Profile |
| `HeyGen: pedido invalido` | Verifica o avatar_id em app.heygen.com |
| `Timeout: HeyGen demorou mais de 5 min` | Tenta novamente — pode ser pico de uso |
| `Voice ID invalido` | Vai ao ElevenLabs -> Voices -> copia o ID correcto |
| Audio soa robotico | Muda `stability` para 0.4 e `style` para 0.5 em config.json |

---

## CREDITOS UTILIZADOS POR VIDEO

| Servico | Uso por video | Plano recomendado |
|---------|--------------|-------------------|
| ElevenLabs | ~200-300 caracteres de TTS | Starter (30k chars/mes) |
| HeyGen | ~1 minuto de video | Creator (10 min/mes) |

**Estimativa para 30 videos/mes:** ElevenLabs Starter ($5/mes) + HeyGen Creator ($29/mes)

---

*Pipeline de Video AI · Comunidade IA Avancada PT · Eurico Alves*
